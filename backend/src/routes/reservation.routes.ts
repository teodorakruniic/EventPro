import { Router, type Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();
const uuidSchema = z.string().uuid();
const SEATS_PER_ROW = 10;

async function getAttendee(userId?: string) {
  if (!userId) return null;
  return prisma.user.findFirst({ where: { id: userId, role: "ATTENDEE" }, select: { id: true } });
}

function serverError(res: Response, error: unknown) {
  console.error("Reservation error:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(409).json({ message: "This seat is already reserved, or you already reserved this talk." });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    res.status(409).json({ message: "Reservation conflict. Please try again." });
    return;
  }
  res.status(500).json({ message: "An unexpected server error occurred." });
}

function buildSeatNumbers(capacity: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < capacity; i += 1) {
    const rowIndex = Math.floor(i / SEATS_PER_ROW);
    // Rows A-Z; for larger rooms continue AA, AB, etc.
    let index = rowIndex;
    let row = "";
    do {
      row = String.fromCharCode(65 + (index % 26)) + row;
      index = Math.floor(index / 26) - 1;
    } while (index >= 0);
    result.push(`${row}${(i % SEATS_PER_ROW) + 1}`);
  }
  return result;
}

// GET /api/reservations/my
router.get("/my", requireAuth, async (req: AuthRequest, res) => {
  try {
    const attendee = await getAttendee(req.userId);
    if (!attendee) { res.status(403).json({ message: "Attendee access required." }); return; }
    const reservations = await prisma.talkReservation.findMany({
      where: { userId: attendee.id },
      include: { talk: { include: {
        room: true,
        conference: { select: { id: true, title: true, location: true, startsAt: true, endsAt: true, status: true } },
        speaker: { select: { id: true, firstName: true, lastName: true } },
      } } },
      orderBy: { talk: { startsAt: "asc" } },
    });
    res.json(reservations);
  } catch (error) { serverError(res, error); }
});

// GET /api/reservations/conferences/:conferenceId
router.get("/conferences/:conferenceId", requireAuth, async (req: AuthRequest, res) => {
  const parsed = uuidSchema.safeParse(req.params.conferenceId);
  if (!parsed.success) { res.status(400).json({ message: "Invalid conference ID." }); return; }
  try {
    const attendee = await getAttendee(req.userId);
    if (!attendee) { res.status(403).json({ message: "Attendee access required." }); return; }
    const reservations = await prisma.talkReservation.findMany({
      where: { userId: attendee.id, talk: { conferenceId: parsed.data } },
      select: { talkId: true },
    });
    res.json({ talkIds: reservations.map((item) => item.talkId) });
  } catch (error) { serverError(res, error); }
});

// GET /api/reservations/talks/:talkId/seats
router.get("/talks/:talkId/seats", requireAuth, async (req: AuthRequest, res) => {
  const parsed = uuidSchema.safeParse(req.params.talkId);
  if (!parsed.success) { res.status(400).json({ message: "Invalid talk ID." }); return; }
  try {
    const attendee = await getAttendee(req.userId);
    if (!attendee) { res.status(403).json({ message: "Attendee access required." }); return; }
    const talk = await prisma.talk.findUnique({
      where: { id: parsed.data },
      include: { room: true, conference: { select: { status: true } } },
    });
    if (!talk || talk.status !== "ACCEPTED" || talk.conference.status !== "PUBLISHED" || !talk.room || !talk.startsAt || !talk.endsAt) {
      res.status(404).json({ message: "Available talk not found." }); return;
    }
    const reservations = await prisma.talkReservation.findMany({
      where: { talkId: talk.id }, select: { userId: true, seatNumber: true },
    });
    const seats = buildSeatNumbers(talk.room.capacity);
    const occupiedSeats = reservations.flatMap((item) => item.seatNumber ? [item.seatNumber] : []);
    const mine = reservations.find((item) => item.userId === attendee.id);
    res.json({
      talkId: talk.id,
      roomName: talk.room.name,
      capacity: talk.room.capacity,
      seats,
      occupiedSeats,
      mySeat: mine?.seatNumber ?? null,
      hasReservation: Boolean(mine),
      legacyReservations: reservations.filter((item) => item.seatNumber === null).length,
      reservationClosed: talk.startsAt <= new Date(),
    });
  } catch (error) { serverError(res, error); }
});

// POST /api/reservations/talks/:talkId { seatNumber: "A1" }
// PATCH /api/reservations/talks/:talkId/seat { seatNumber: "B3" }
async function reserveOrChange(req: AuthRequest, res: Response, change: boolean) {
  const parsedId = uuidSchema.safeParse(req.params.talkId);
  const parsedBody = z.object({ seatNumber: z.string().trim().toUpperCase().regex(/^[A-Z]+[1-9][0-9]*$/) }).safeParse(req.body);
  if (!parsedId.success) { res.status(400).json({ message: "Invalid talk ID." }); return; }
  if (!parsedBody.success) { res.status(400).json({ message: "A valid seat number is required." }); return; }
  try {
    const attendee = await getAttendee(req.userId);
    if (!attendee) { res.status(403).json({ message: "Attendee access required." }); return; }
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${parsedId.data}))::text AS lock_result`;
      const talk = await tx.talk.findUnique({
        where: { id: parsedId.data }, include: { room: true, conference: true },
      });
      if (!talk) return { status: 404, message: "Talk not found." };
      if (talk.status !== "ACCEPTED" || !talk.room || !talk.startsAt || !talk.endsAt || talk.conference.status !== "PUBLISHED") {
        return { status: 409, message: "This talk is not available for reservation." };
      }
      if (talk.startsAt <= new Date()) return { status: 409, message: "Reservations are closed for this talk." };
      if (!buildSeatNumbers(talk.room.capacity).includes(parsedBody.data.seatNumber)) {
        return { status: 400, message: "This seat does not exist in the room." };
      }
      const registration = await tx.conferenceRegistration.findUnique({
        where: { userId_conferenceId: { userId: attendee.id, conferenceId: talk.conferenceId } },
      });
      if (!registration) return { status: 403, message: "Register for the conference before reserving a talk." };
      const existing = await tx.talkReservation.findUnique({
        where: { userId_talkId: { userId: attendee.id, talkId: talk.id } },
      });
      if (change && !existing) return { status: 404, message: "Reservation not found." };
      if (!change && existing) return { status: 409, message: "You already reserved this talk." };
      if (existing?.seatNumber === parsedBody.data.seatNumber) return { status: 409, message: "You already have this seat." };
      const seatTaken = await tx.talkReservation.findFirst({
        where: { talkId: talk.id, seatNumber: parsedBody.data.seatNumber }, select: { id: true },
      });
      if (seatTaken) return { status: 409, message: "This seat is already occupied." };
      if (!change) {
        const conflict = await tx.talkReservation.findFirst({
          where: { userId: attendee.id, talk: { startsAt: { lt: talk.endsAt }, endsAt: { gt: talk.startsAt } } },
          include: { talk: { select: { title: true } } },
        });
        if (conflict) return { status: 409, message: `Time conflict with "${conflict.talk.title}".` };
      }
      const count = await tx.talkReservation.count({ where: { talkId: talk.id } });
      if (!change && count >= talk.room.capacity) return { status: 409, message: "This talk is fully booked." };
      const reservation = change && existing
        ? await tx.talkReservation.update({ where: { id: existing.id }, data: { seatNumber: parsedBody.data.seatNumber } })
        : await tx.talkReservation.create({ data: { userId: attendee.id, talkId: talk.id, seatNumber: parsedBody.data.seatNumber } });
      return { status: change ? 200 : 201, reservation };
    });
    if ("message" in result) { res.status(result.status).json({ message: result.message }); return; }
    res.status(result.status).json(result.reservation);
  } catch (error) { serverError(res, error); }
}
router.post("/talks/:talkId", requireAuth, async (req: AuthRequest, res) => { await reserveOrChange(req, res, false); });
router.patch("/talks/:talkId/seat", requireAuth, async (req: AuthRequest, res) => { await reserveOrChange(req, res, true); });

// DELETE /api/reservations/talks/:talkId
router.delete("/talks/:talkId", requireAuth, async (req: AuthRequest, res) => {
  const parsed = uuidSchema.safeParse(req.params.talkId);
  if (!parsed.success) { res.status(400).json({ message: "Invalid talk ID." }); return; }
  try {
    const attendee = await getAttendee(req.userId);
    if (!attendee) { res.status(403).json({ message: "Attendee access required." }); return; }
    const result = await prisma.talkReservation.deleteMany({ where: { userId: attendee.id, talkId: parsed.data } });
    if (!result.count) { res.status(404).json({ message: "Reservation not found." }); return; }
    res.status(204).send();
  } catch (error) { serverError(res, error); }
});


const ticketSchema = z.object({
  reservationId: uuidSchema,
});

const checkInSchema = z.object({
  ticketToken: uuidSchema,
});

// GET /api/reservations/tickets/:reservationId
router.get(
  "/tickets/:reservationId",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsed = ticketSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid reservation ID.",
      });
      return;
    }

    try {
      const attendee = await getAttendee(req.userId);

      if (!attendee) {
        res.status(403).json({
          message: "Attendee access required.",
        });
        return;
      }

      const reservation = await prisma.talkReservation.findFirst({
        where: {
          id: parsed.data.reservationId,
          userId: attendee.id,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          talk: {
            include: {
              room: {
                select: {
                  name: true,
                },
              },
              conference: {
                select: {
                  id: true,
                  title: true,
                  location: true,
                  status: true,
                  organizerId: true,
                },
              },
            },
          },
        },
      });

      if (!reservation) {
        res.status(404).json({
          message: "Ticket not found.",
        });
        return;
      }

      res.json({
        id: reservation.id,
        ticketToken: reservation.ticketToken,
        attendee: reservation.user,
        seatNumber: reservation.seatNumber,
        checkedInAt: reservation.checkedInAt,
        talk: {
          id: reservation.talk.id,
          title: reservation.talk.title,
          startsAt: reservation.talk.startsAt,
          endsAt: reservation.talk.endsAt,
          room: reservation.talk.room,
        },
        conference: reservation.talk.conference,
      });
    } catch (error) {
      serverError(res, error);
    }
  }
);

// POST /api/reservations/check-in
router.post(
  "/check-in",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsed = checkInSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "A valid ticket token is required.",
      });
      return;
    }

    try {
      if (!req.userId) {
        res.status(401).json({
          message: "Authentication required.",
        });
        return;
      }

      const organizer = await prisma.user.findFirst({
        where: {
          id: req.userId,
          role: "ORGANIZER",
        },
        select: {
          id: true,
        },
      });

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required.",
        });
        return;
      }

      const reservation = await prisma.talkReservation.findUnique({
        where: {
          ticketToken: parsed.data.ticketToken,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          talk: {
            include: {
              conference: true,
              room: true,
            },
          },
        },
      });

      if (!reservation) {
        res.status(404).json({
          message: "Invalid ticket.",
        });
        return;
      }

      if (
        reservation.talk.conference.organizerId !== organizer.id
      ) {
        res.status(403).json({
          message:
            "You cannot check in attendees for this conference.",
        });
        return;
      }

      if (
        reservation.talk.status !== "ACCEPTED" ||
        reservation.talk.conference.status !== "PUBLISHED"
      ) {
        res.status(409).json({
          message: "This ticket is not currently valid.",
        });
        return;
      }

      if (reservation.checkedInAt) {
        res.status(409).json({
          message: "This ticket has already been checked in.",
          checkedInAt: reservation.checkedInAt,
        });
        return;
      }

      const result = await prisma.talkReservation.updateMany({
        where: {
          id: reservation.id,
          checkedInAt: null,
        },
        data: {
          checkedInAt: new Date(),
          checkedInBy: organizer.id,
        },
      });

      if (result.count === 0) {
        res.status(409).json({
          message: "This ticket has already been checked in.",
        });
        return;
      }

      res.json({
        message: "Check-in completed successfully.",
        reservationId: reservation.id,
        attendee: reservation.user,
        talk: reservation.talk.title,
        seatNumber: reservation.seatNumber,
        checkedIn: true,
      });
    } catch (error) {
      serverError(res, error);
    }
  }
);

export default router;
