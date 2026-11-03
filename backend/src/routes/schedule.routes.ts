
import { Router, type Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

const uuidSchema = z.string().uuid();

const roomSchema = z.object({
  name: z.string().trim().min(2).max(100),
  capacity: z.number().int().positive().max(100000),
});

const scheduleSchema = z.object({
  roomId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
});

async function getOrganizer(req: AuthRequest) {
  if (!req.userId) return null;

  return prisma.user.findFirst({
    where: {
      id: req.userId,
      role: "ORGANIZER",
    },
    select: {
      id: true,
    },
  });
}

function handleError(res: Response, error: unknown) {
  console.error("Schedule route error:", error);

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    res.status(409).json({
      message: "A room with this name already exists.",
    });
    return;
  }

  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
}

function isValidTimeRange(start: Date, end: Date) {
  return (
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    start < end
  );
}

/*
 * GET /api/schedule/conferences/:conferenceId/rooms
 * Public: rooms of a published conference.
 * Organizer: rooms of their own conference, including drafts.
 */
router.get(
  "/conferences/:conferenceId/rooms",
  async (req, res) => {
    const parsedId = uuidSchema.safeParse(req.params.conferenceId);

    if (!parsedId.success) {
      res.status(400).json({
        message: "Invalid conference ID.",
      });
      return;
    }

    try {
      const conference = await prisma.conference.findUnique({
        where: { id: parsedId.data },
        select: {
          id: true,
          status: true,
        },
      });

      if (!conference || conference.status !== "PUBLISHED") {
        res.status(404).json({
          message: "Published conference not found.",
        });
        return;
      }

      const rooms = await prisma.room.findMany({
        where: {
          conferenceId: conference.id,
        },
        orderBy: {
          name: "asc",
        },
      });

      res.json(rooms);
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * GET /api/schedule/manage/:conferenceId/rooms
 * Organizer: list rooms of their own conference.
 */
router.get(
  "/manage/:conferenceId/rooms",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsedId = uuidSchema.safeParse(req.params.conferenceId);

    if (!parsedId.success) {
      res.status(400).json({
        message: "Invalid conference ID.",
      });
      return;
    }

    try {
      const organizer = await getOrganizer(req);

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required.",
        });
        return;
      }

      const conference = await prisma.conference.findFirst({
        where: {
          id: parsedId.data,
          organizerId: organizer.id,
        },
      });

      if (!conference) {
        res.status(404).json({
          message: "Conference not found or access denied.",
        });
        return;
      }

      const rooms = await prisma.room.findMany({
        where: {
          conferenceId: conference.id,
        },
        include: {
          _count: {
            select: {
              talks: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      res.json(rooms);
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * POST /api/schedule/conferences/:conferenceId/rooms
 * Organizer: create a room.
 */
router.post(
  "/conferences/:conferenceId/rooms",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsedId = uuidSchema.safeParse(req.params.conferenceId);
    const parsedBody = roomSchema.safeParse(req.body);

    if (!parsedId.success || !parsedBody.success) {
      res.status(400).json({
        message: "Invalid room data.",
        errors: parsedBody.success
          ? undefined
          : parsedBody.error.flatten(),
      });
      return;
    }

    try {
      const organizer = await getOrganizer(req);

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required.",
        });
        return;
      }

      const conference = await prisma.conference.findFirst({
        where: {
          id: parsedId.data,
          organizerId: organizer.id,
        },
      });

      if (!conference) {
        res.status(404).json({
          message: "Conference not found or access denied.",
        });
        return;
      }

      if (conference.status === "ARCHIVED") {
        res.status(409).json({
          message: "Archived conferences cannot be modified.",
        });
        return;
      }

      const room = await prisma.room.create({
        data: {
          name: parsedBody.data.name,
          capacity: parsedBody.data.capacity,
          conferenceId: conference.id,
        },
      });

      res.status(201).json(room);
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * DELETE /api/schedule/rooms/:roomId
 * Organizer: delete an unused room.
 */
router.delete(
  "/rooms/:roomId",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsedId = uuidSchema.safeParse(req.params.roomId);

    if (!parsedId.success) {
      res.status(400).json({
        message: "Invalid room ID.",
      });
      return;
    }

    try {
      const organizer = await getOrganizer(req);

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required.",
        });
        return;
      }

      const room = await prisma.room.findUnique({
        where: {
          id: parsedId.data,
        },
        include: {
          conference: true,
        },
      });

      if (!room) {
        res.status(404).json({
          message: "Room not found.",
        });
        return;
      }

      if (room.conference.organizerId !== organizer.id) {
        res.status(403).json({
          message: "You cannot manage this room.",
        });
        return;
      }

      if (room.conference.status === "ARCHIVED") {
        res.status(409).json({
          message: "Archived conferences cannot be modified.",
        });
        return;
      }

      // Lock this conference's scheduling operations.
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(${room.conferenceId})
          )::text AS lock_result
        `;

        const assignedTalks = await tx.talk.count({
          where: {
            roomId: room.id,
          },
        });

        if (assignedTalks > 0) {
          return "IN_USE" as const;
        }

        await tx.room.delete({
          where: {
            id: room.id,
          },
        });

        return "DELETED" as const;
      });

      if (result === "IN_USE") {
        res.status(409).json({
          message:
            "This room has scheduled talks. Remove their schedules first.",
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * GET /api/schedule/manage/:conferenceId/talks
 * Organizer: all accepted talks, scheduled and unscheduled.
 */
router.get(
  "/manage/:conferenceId/talks",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsedId = uuidSchema.safeParse(req.params.conferenceId);

    if (!parsedId.success) {
      res.status(400).json({
        message: "Invalid conference ID.",
      });
      return;
    }

    try {
      const organizer = await getOrganizer(req);

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required.",
        });
        return;
      }

      const conference = await prisma.conference.findFirst({
        where: {
          id: parsedId.data,
          organizerId: organizer.id,
        },
      });

      if (!conference) {
        res.status(404).json({
          message: "Conference not found or access denied.",
        });
        return;
      }

      const talks = await prisma.talk.findMany({
        where: {
          conferenceId: conference.id,
          status: "ACCEPTED",
        },
        include: {
          speaker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          room: {
            select: {
              id: true,
              name: true,
              capacity: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      res.json(talks);
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * PATCH /api/schedule/talks/:talkId
 * Organizer: assign or change a room and time.
 *
 * Prevents overlapping talks in the same room
 * or for the same speaker.
 */
router.patch(
  "/talks/:talkId",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsedId = uuidSchema.safeParse(req.params.talkId);
    const parsedBody = scheduleSchema.safeParse(req.body);

    if (!parsedId.success || !parsedBody.success) {
      res.status(400).json({
        message: "Invalid schedule data.",
        errors: parsedBody.success
          ? undefined
          : parsedBody.error.flatten(),
      });
      return;
    }

    const startsAt = new Date(parsedBody.data.startsAt);
    const endsAt = new Date(parsedBody.data.endsAt);

    if (!isValidTimeRange(startsAt, endsAt)) {
      res.status(400).json({
        message: "End time must be after start time.",
      });
      return;
    }

    try {
      const organizer = await getOrganizer(req);

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required.",
        });
        return;
      }

      const talk = await prisma.talk.findUnique({
        where: {
          id: parsedId.data,
        },
        select: {
          id: true,
          conferenceId: true,
        },
      });

      if (!talk) {
        res.status(404).json({
          message: "Talk not found.",
        });
        return;
      }

      // Serialize scheduling changes within one conference.
      // This prevents two concurrent requests from
      // booking the same room or speaker simultaneously.
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(${talk.conferenceId})
          )::text AS lock_result
        `;

        const currentTalk = await tx.talk.findUnique({
          where: {
            id: talk.id,
          },
          include: {
            conference: true,
          },
        });

        if (!currentTalk) {
          return { error: "Talk not found.", status: 404 };
        }

        if (currentTalk.conference.organizerId !== organizer.id) {
          return {
            error: "You cannot schedule this talk.",
            status: 403,
          };
        }

        if (currentTalk.status !== "ACCEPTED") {
          return {
            error: "Only accepted talks can be scheduled.",
            status: 409,
          };
        }

        if (currentTalk.conference.status === "ARCHIVED") {
          return {
            error: "Archived conferences cannot be modified.",
            status: 409,
          };
        }

        if (
          startsAt < currentTalk.conference.startsAt ||
          endsAt > currentTalk.conference.endsAt
        ) {
          return {
            error: "Talk must fit within conference dates.",
            status: 400,
          };
        }

        const room = await tx.room.findFirst({
          where: {
            id: parsedBody.data.roomId,
            conferenceId: currentTalk.conferenceId,
          },
        });

        if (!room) {
          return {
            error: "Room not found in this conference.",
            status: 404,
          };
        }

        const conflictingTalks = await tx.talk.findMany({
          where: {
            id: {
              not: currentTalk.id,
            },
            status: "ACCEPTED",
            startsAt: {
              lt: endsAt,
            },
            endsAt: {
              gt: startsAt,
            },
            OR: [
              {
                roomId: room.id,
              },
              {
                speakerId: currentTalk.speakerId,
              },
            ],
          },
          select: {
            id: true,
            title: true,
            roomId: true,
            speakerId: true,
          },
        });

        const roomConflict = conflictingTalks.find(
          (item) => item.roomId === room.id
        );

        if (roomConflict) {
          return {
            error:
              `Room conflict: "${roomConflict.title}" ` +
              "is already scheduled at this time.",
            status: 409,
          };
        }

        const speakerConflict = conflictingTalks.find(
          (item) =>
            item.speakerId === currentTalk.speakerId
        );

        if (speakerConflict) {
          return {
            error:
              `Speaker conflict: "${speakerConflict.title}" ` +
              "overlaps with this time slot.",
            status: 409,
          };
        }

        const updated = await tx.talk.update({
          where: {
            id: currentTalk.id,
          },
          data: {
            roomId: room.id,
            startsAt,
            endsAt,
          },
          include: {
            room: true,
            speaker: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        return {
          talk: updated,
          status: 200,
        };
      });

      if ("error" in result) {
        res.status(result.status).json({
          message: result.error,
        });
        return;
      }

      res.json(result.talk);
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * DELETE /api/schedule/talks/:talkId
 * Organizer: remove a talk from the schedule.
 * The accepted proposal itself remains in the database.
 */
router.delete(
  "/talks/:talkId",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsedId = uuidSchema.safeParse(req.params.talkId);

    if (!parsedId.success) {
      res.status(400).json({
        message: "Invalid talk ID.",
      });
      return;
    }

    try {
      const organizer = await getOrganizer(req);

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required.",
        });
        return;
      }

      const talk = await prisma.talk.findUnique({
        where: {
          id: parsedId.data,
        },
        select: {
          id: true,
          conferenceId: true,
        },
      });

      if (!talk) {
        res.status(404).json({
          message: "Talk not found.",
        });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(${talk.conferenceId})
          )::text AS lock_result
        `;

        const currentTalk = await tx.talk.findUnique({
          where: {
            id: talk.id,
          },
          include: {
            conference: true,
          },
        });

        if (!currentTalk) {
          return { error: "Talk not found.", status: 404 };
        }

        if (currentTalk.conference.organizerId !== organizer.id) {
          return {
            error: "You cannot manage this talk.",
            status: 403,
          };
        }

        if (currentTalk.conference.status === "ARCHIVED") {
          return {
            error: "Archived conferences cannot be modified.",
            status: 409,
          };
        }

        if (currentTalk.status !== "ACCEPTED") {
          return {
            error: "Only accepted talks can be unscheduled.",
            status: 409,
          };
        }

        const reservations = await tx.talkReservation.count({
          where: {
            talkId: currentTalk.id,
          },
        });

        if (reservations > 0) {
          return {
            error:
              "This talk has reservations and cannot be unscheduled.",
            status: 409,
          };
        }

        await tx.talk.update({
          where: {
            id: currentTalk.id,
          },
          data: {
            roomId: null,
            startsAt: null,
            endsAt: null,
          },
        });

        return { status: 204 };
      });

      if ("error" in result) {
        res.status(result.status).json({
          message: result.error,
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * GET /api/schedule/conferences/:conferenceId/program
 * Public: scheduled accepted talks of a published conference.
 */
router.get(
  "/conferences/:conferenceId/program",
  async (req, res) => {
    const parsedId = uuidSchema.safeParse(req.params.conferenceId);

    if (!parsedId.success) {
      res.status(400).json({
        message: "Invalid conference ID.",
      });
      return;
    }

    try {
      const conference = await prisma.conference.findFirst({
        where: {
          id: parsedId.data,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          title: true,
          location: true,
          startsAt: true,
          endsAt: true,
        },
      });

      if (!conference) {
        res.status(404).json({
          message: "Published conference not found.",
        });
        return;
      }

      const talks = await prisma.talk.findMany({
        where: {
          conferenceId: conference.id,
          status: "ACCEPTED",
          roomId: {
            not: null,
          },
          startsAt: {
            not: null,
          },
          endsAt: {
            not: null,
          },
        },
        include: {
          room: {
            select: {
              id: true,
              name: true,
              capacity: true,
            },
          },
          speaker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { startsAt: "asc" },
          { title: "asc" },
        ],
      });

      res.json({
        conference,
        talks,
      });
    } catch (error) {
      handleError(res, error);
    }
  }
);

export default router;
