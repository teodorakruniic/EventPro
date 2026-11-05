import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/conferences", requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) { res.status(401).json({ message: "Authentication required." }); return; }
  try {
    const organizer = await prisma.user.findFirst({
      where: { id: req.userId, role: "ORGANIZER" }, select: { id: true },
    });
    if (!organizer) { res.status(403).json({ message: "Organizer access required." }); return; }
    const conferences = await prisma.conference.findMany({
      where: { organizerId: organizer.id },
      select: { id: true, title: true, status: true, startsAt: true },
      orderBy: { startsAt: "desc" },
    });
    res.json(conferences);
  } catch (error) {
    console.error("Statistics conferences error:", error);
    res.status(500).json({ message: "Failed to load conferences." });
  }
});

router.get("/conferences/:id", requireAuth, async (req: AuthRequest, res) => {
  const parsed = z.string().uuid().safeParse(req.params.id);
  if (!parsed.success) { res.status(400).json({ message: "Invalid conference ID." }); return; }
  if (!req.userId) { res.status(401).json({ message: "Authentication required." }); return; }

  try {
    const organizer = await prisma.user.findFirst({
      where: { id: req.userId, role: "ORGANIZER" }, select: { id: true },
    });
    if (!organizer) { res.status(403).json({ message: "Organizer access required." }); return; }

    const conference = await prisma.conference.findFirst({
      where: { id: parsed.data, organizerId: organizer.id },
      select: {
        id: true, title: true, status: true, capacity: true, startsAt: true,
        _count: { select: { registrations: true } },
        talks: {
          where: { status: "ACCEPTED" },
          select: {
            id: true, title: true, startsAt: true,
            room: { select: { name: true, capacity: true } },
            _count: { select: { reservations: true, waitlistEntries: true } },
          },
          orderBy: { startsAt: "asc" },
        },
      },
    });
    if (!conference) { res.status(404).json({ message: "Conference not found." }); return; }

    const registered = conference._count.registrations;
    const sessions = conference.talks.map(talk => {
      const capacity = talk.room?.capacity ?? 0;
      const reserved = talk._count.reservations;
      return {
        id: talk.id, title: talk.title, startsAt: talk.startsAt,
        roomName: talk.room?.name ?? null,
        capacity, reserved, available: Math.max(0, capacity - reserved),
        occupancyPercent: capacity > 0 ? Math.round(reserved / capacity * 100) : 0,
        waitlisted: talk._count.waitlistEntries,
        scheduled: Boolean(talk.room && talk.startsAt),
      };
    });

    res.json({
      id: conference.id, title: conference.title, status: conference.status,
      capacity: conference.capacity, registered,
      available: Math.max(0, conference.capacity - registered),
      occupancyPercent: conference.capacity > 0 ? Math.round(registered / conference.capacity * 100) : 0,
      totalReserved: sessions.reduce((sum, session) => sum + session.reserved, 0),
      totalWaitlisted: sessions.reduce((sum, session) => sum + session.waitlisted, 0),
      sessions,
    });
  } catch (error) {
    console.error("Conference statistics error:", error);
    res.status(500).json({ message: "Failed to load conference statistics." });
  }
});

export default router;
