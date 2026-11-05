
import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { lockTalk, promoteFromWaitlist } from "./reservation.routes.js";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

const conferenceSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().max(5000).optional(),
    location: z.string().trim().min(2).max(200),
    capacity: z.number().int().min(1).max(100000),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
  })
  .refine(
    (data) =>
      new Date(data.endsAt).getTime() >
      new Date(data.startsAt).getTime(),
    {
      message: "End date must be after start date",
      path: ["endsAt"],
    }
  );

const conferenceInclude = {
  organizer: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
  _count: {
    select: {
      registrations: true,
    },
  },
} satisfies Prisma.ConferenceInclude;

const conferenceDetailsInclude = {
  ...conferenceInclude,
  talks: {
    where: {
      status: "ACCEPTED" as const,
    },
    include: {
      speaker: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      room: {
        select: {
          name: true,
          capacity: true,
        },
      },
    },
    orderBy: {
      startsAt: "asc" as const,
    },
  },
} satisfies Prisma.ConferenceInclude;

function isValidId(id: string): boolean {
  return z.string().uuid().safeParse(id).success;
}

function handleDatabaseError(
  error: unknown,
  res: import("express").Response,
  message: string
) {
  console.error(message, error);

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2023"
  ) {
    res.status(400).json({
      message: "Invalid identifier",
    });
    return;
  }

  res.status(500).json({ message });
}

async function getOrganizer(userId: string | undefined) {
  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ORGANIZER",
    },
    select: {
      id: true,
    },
  });
}

/* Public conference listing */

router.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 150) : "";
  const location = typeof req.query.location === "string" ? req.query.location.trim().slice(0, 200) : "";
  const from = typeof req.query.from === "string" ? req.query.from : "";
  const to = typeof req.query.to === "string" ? req.query.to : "";
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  if ((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime()))) {
    res.status(400).json({ message: "Invalid date filter" });
    return;
  }

  try {
    const conferences = await prisma.conference.findMany({
      where: {
        status: "PUBLISHED",
        ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
        ...(location ? { location: { contains: location, mode: "insensitive" as const } } : {}),
        ...(fromDate || toDate ? { startsAt: {
          ...(fromDate ? { gte: fromDate } : {}),
          ...(toDate ? { lte: toDate } : {}),
        } } : {}),
      },
      orderBy: { startsAt: "asc" },
      include: conferenceInclude,
    });

    res.json(conferences);
  } catch (error) {
    handleDatabaseError(error, res, "Failed to load conferences");
  }
});

/* Organizer's conferences */

router.get(
  "/mine",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const organizer = await getOrganizer(req.userId);

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required",
        });
        return;
      }

      const conferences = await prisma.conference.findMany({
        where: {
          organizerId: organizer.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: conferenceInclude,
      });

      res.json(conferences);
    } catch (error) {
      handleDatabaseError(
        error,
        res,
        "Failed to load your conferences"
      );
    }
  }
);

/* Create a draft conference */

router.post(
  "/",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsed = conferenceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid conference data",
        errors: parsed.error.flatten(),
      });
      return;
    }

    try {
      const organizer = await getOrganizer(req.userId);

      if (!organizer) {
        res.status(403).json({
          message: "Only organizers can create conferences",
        });
        return;
      }

      const conference = await prisma.conference.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description ?? "",
          location: parsed.data.location,
          capacity: parsed.data.capacity,
          startsAt: new Date(parsed.data.startsAt),
          endsAt: new Date(parsed.data.endsAt),
          organizerId: organizer.id,
          status: "DRAFT",
        },
        include: conferenceInclude,
      });

      res.status(201).json(conference);
    } catch (error) {
      handleDatabaseError(
        error,
        res,
        "Failed to create conference"
      );
    }
  }
);

/* Update a draft conference */

router.patch(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      res.status(400).json({
        message: "Invalid conference ID",
      });
      return;
    }

    const parsed = conferenceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid conference data",
        errors: parsed.error.flatten(),
      });
      return;
    }

    try {
      const organizer = await getOrganizer(req.userId);

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required",
        });
        return;
      }

      const result = await prisma.conference.updateMany({
        where: {
          id,
          organizerId: organizer.id,
          status: "DRAFT",
        },
        data: {
          title: parsed.data.title,
          description: parsed.data.description ?? "",
          location: parsed.data.location,
          capacity: parsed.data.capacity,
          startsAt: new Date(parsed.data.startsAt),
          endsAt: new Date(parsed.data.endsAt),
        },
      });

      if (result.count === 0) {
        res.status(404).json({
          message: "Editable draft conference not found",
        });
        return;
      }

      const conference = await prisma.conference.findUnique({
        where: { id },
        include: conferenceInclude,
      });

      res.json(conference);
    } catch (error) {
      handleDatabaseError(
        error,
        res,
        "Failed to update conference"
      );
    }
  }
);

/* Publish a draft conference */

router.patch(
  "/:id/publish",
  requireAuth,
  async (req: AuthRequest, res) => {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      res.status(400).json({
        message: "Invalid conference ID",
      });
      return;
    }

    try {
      const organizer = await getOrganizer(req.userId);

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required",
        });
        return;
      }

      const result = await prisma.conference.updateMany({
        where: {
          id,
          organizerId: organizer.id,
          status: "DRAFT",
          capacity: {
            gte: 1,
          },
        },
        data: {
          status: "PUBLISHED",
        },
      });

      if (result.count === 0) {
        res.status(404).json({
          message: "Publishable draft conference not found",
        });
        return;
      }

      const conference = await prisma.conference.findUnique({
        where: { id },
        include: conferenceInclude,
      });

      res.json(conference);
    } catch (error) {
      handleDatabaseError(
        error,
        res,
        "Failed to publish conference"
      );
    }
  }
);

/* Delete a draft conference */

router.delete(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      res.status(400).json({
        message: "Invalid conference ID",
      });
      return;
    }

    try {
      const organizer = await getOrganizer(req.userId);

      if (!organizer) {
        res.status(403).json({
          message: "Organizer access required",
        });
        return;
      }

      const result = await prisma.conference.deleteMany({
        where: {
          id,
          organizerId: organizer.id,
          status: "DRAFT",
        },
      });

      if (result.count === 0) {
        res.status(404).json({
          message: "Deletable draft conference not found",
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      handleDatabaseError(
        error,
        res,
        "Failed to delete conference"
      );
    }
  }
);

/* Conference cover image, duplication and archiving */

const conferenceImageDirectory = path.resolve(process.cwd(), "uploads", "conferences");
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new Error("Only JPG, PNG and WebP images are allowed"));
      return;
    }
    callback(null, true);
  },
});

function imageExtension(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

async function removeConferenceImage(imageUrl: string | null) {
  const prefix = "/uploads/conferences/";
  if (!imageUrl?.startsWith(prefix)) return;
  const filename = imageUrl.slice(prefix.length);
  if (!/^[0-9a-f-]+\.(jpg|png|webp)$/i.test(filename)) return;
  try {
    await fs.unlink(path.join(conferenceImageDirectory, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Unable to remove conference image:", error);
    }
  }
}

router.post("/:id/image", requireAuth, (req: AuthRequest, res, next) => {
  imageUpload.single("image")(req, res, (error: unknown) => {
    if (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid image upload" });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  if (!isValidId(id)) {
    res.status(400).json({ message: "Invalid conference ID" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ message: "Please select an image" });
    return;
  }

  try {
    const organizer = await getOrganizer(req.userId);
    if (!organizer) {
      res.status(403).json({ message: "Organizer access required" });
      return;
    }
    const existing = await prisma.conference.findFirst({
      where: { id, organizerId: organizer.id, status: { in: ["DRAFT", "PUBLISHED"] } },
      select: { imageUrl: true },
    });
    if (!existing) {
      res.status(404).json({ message: "Editable conference not found" });
      return;
    }

    const extension = imageExtension(req.file.buffer);
    if (!extension) {
      res.status(400).json({ message: "Invalid image file" });
      return;
    }

    await fs.mkdir(conferenceImageDirectory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    const filePath = path.join(conferenceImageDirectory, filename);
    await fs.writeFile(filePath, req.file.buffer, { flag: "wx" });
    const imageUrl = `/uploads/conferences/${filename}`;

    try {
      const updated = await prisma.conference.updateMany({
        where: { id, organizerId: organizer.id, status: { in: ["DRAFT", "PUBLISHED"] } },
        data: { imageUrl },
      });
      if (updated.count === 0) {
        await fs.unlink(filePath).catch(() => undefined);
        res.status(409).json({ message: "Conference is no longer editable" });
        return;
      }
      const conference = await prisma.conference.findUnique({ where: { id }, include: conferenceInclude });
      if (existing.imageUrl) await removeConferenceImage(existing.imageUrl);
      res.json({ message: "Conference image updated", conference });
    } catch (error) {
      await fs.unlink(filePath).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    handleDatabaseError(error, res, "Failed to upload conference image");
  }
});

router.delete("/:id/image", requireAuth, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  if (!isValidId(id)) {
    res.status(400).json({ message: "Invalid conference ID" });
    return;
  }
  try {
    const organizer = await getOrganizer(req.userId);
    if (!organizer) {
      res.status(403).json({ message: "Organizer access required" });
      return;
    }
    const existing = await prisma.conference.findFirst({
      where: { id, organizerId: organizer.id, status: { in: ["DRAFT", "PUBLISHED"] } },
      select: { imageUrl: true },
    });
    if (!existing) {
      res.status(404).json({ message: "Editable conference not found" });
      return;
    }
    await prisma.conference.updateMany({
      where: { id, organizerId: organizer.id, status: { in: ["DRAFT", "PUBLISHED"] } },
      data: { imageUrl: null },
    });
    await removeConferenceImage(existing.imageUrl);
    const conference = await prisma.conference.findUnique({ where: { id }, include: conferenceInclude });
    res.json({ message: "Conference image removed", conference });
  } catch (error) {
    handleDatabaseError(error, res, "Failed to remove conference image");
  }
});

router.post("/:id/duplicate", requireAuth, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  if (!isValidId(id)) {
    res.status(400).json({ message: "Invalid conference ID" });
    return;
  }
  try {
    const organizer = await getOrganizer(req.userId);
    if (!organizer) {
      res.status(403).json({ message: "Organizer access required" });
      return;
    }
    const source = await prisma.conference.findFirst({ where: { id, organizerId: organizer.id } });
    if (!source) {
      res.status(404).json({ message: "Conference not found" });
      return;
    }
    const copy = await prisma.conference.create({
      data: {
        title: `${source.title} (Copy)`.slice(0, 150),
        description: source.description,
        location: source.location,
        capacity: source.capacity,
        startsAt: source.startsAt,
        endsAt: source.endsAt,
        organizerId: organizer.id,
        status: "DRAFT",
        imageUrl: null, // The duplicate starts without a shared image file.
      },
      include: conferenceInclude,
    });
    res.status(201).json(copy);
  } catch (error) {
    handleDatabaseError(error, res, "Failed to duplicate conference");
  }
});

router.patch("/:id/archive", requireAuth, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  if (!isValidId(id)) {
    res.status(400).json({ message: "Invalid conference ID" });
    return;
  }
  try {
    const organizer = await getOrganizer(req.userId);
    if (!organizer) {
      res.status(403).json({ message: "Organizer access required" });
      return;
    }
    const result = await prisma.conference.updateMany({
      where: { id, organizerId: organizer.id, status: { in: ["DRAFT", "PUBLISHED"] } },
      data: { status: "ARCHIVED" },
    });
    if (result.count === 0) {
      res.status(404).json({ message: "Active conference not found" });
      return;
    }
    const conference = await prisma.conference.findUnique({ where: { id }, include: conferenceInclude });
    res.json(conference);
  } catch (error) {
    handleDatabaseError(error, res, "Failed to archive conference");
  }
});

/* Published conference details */

router.get("/:id", async (req, res) => {
  const id = req.params.id as string;

  if (!isValidId(id)) {
    res.status(400).json({
      message: "Invalid conference ID",
    });
    return;
  }

  try {
    const conference = await prisma.conference.findFirst({
      where: {
        id,
        status: "PUBLISHED",
      },
      include: conferenceDetailsInclude,
    });

    if (!conference) {
      res.status(404).json({
        message: "Conference not found",
      });
      return;
    }

    res.json(conference);
  } catch (error) {
    handleDatabaseError(
      error,
      res,
      "Failed to load conference"
    );
  }
});

/* Register for a published conference */

router.post(
  "/:id/register",
  requireAuth,
  async (req: AuthRequest, res) => {
    const conferenceId = req.params.id as string;
    const userId = req.userId;

    if (!isValidId(conferenceId)) {
      res.status(400).json({
        message: "Invalid conference ID",
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        res.status(401).json({
          message: "User not found",
        });
        return;
      }

      if (user.role !== "ATTENDEE") {
        res.status(403).json({
          message: "Only attendees can register for conferences",
        });
        return;
      }

      const result = await prisma.$transaction(
        async (tx) => {
          const conference = await tx.conference.findFirst({
            where: {
              id: conferenceId,
              status: "PUBLISHED",
            },
          });

          if (!conference) {
            return { kind: "not_found" as const };
          }

          const existing =
            await tx.conferenceRegistration.findUnique({
              where: {
                userId_conferenceId: {
                  userId,
                  conferenceId,
                },
              },
            });

          if (existing) {
            return { kind: "duplicate" as const };
          }

          const registeredCount =
            await tx.conferenceRegistration.count({
              where: { conferenceId },
            });

          if (registeredCount >= conference.capacity) {
            return { kind: "full" as const };
          }

          const registration =
            await tx.conferenceRegistration.create({
              data: {
                userId,
                conferenceId,
              },
            });

          return {
            kind: "success" as const,
            registration,
          };
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      if (result.kind === "not_found") {
        res.status(404).json({
          message: "Conference not found",
        });
        return;
      }

      if (result.kind === "duplicate") {
        res.status(409).json({
          message:
            "You are already registered for this conference",
        });
        return;
      }

      if (result.kind === "full") {
        res.status(409).json({
          message: "This conference is fully booked",
        });
        return;
      }

      res.status(201).json({
        message: "Registration successful",
        registration: result.registration,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === "P2002") {
          res.status(409).json({
            message:
              "You are already registered for this conference",
          });
          return;
        }

        if (error.code === "P2034") {
          res.status(409).json({
            message:
              "Registration conflict. Please try again.",
          });
          return;
        }
      }

      handleDatabaseError(
        error,
        res,
        "Failed to register for conference"
      );
    }
  }
);

/* Check current user's registration */

router.get(
  "/:id/registration",
  requireAuth,
  async (req: AuthRequest, res) => {
    const conferenceId = req.params.id as string;
    const userId = req.userId;

    if (!isValidId(conferenceId)) {
      res.status(400).json({
        message: "Invalid conference ID",
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    try {
      const registration =
        await prisma.conferenceRegistration.findUnique({
          where: {
            userId_conferenceId: {
              userId,
              conferenceId,
            },
          },
        });

      res.json({
        registered: Boolean(registration),
      });
    } catch (error) {
      handleDatabaseError(
        error,
        res,
        "Failed to check registration"
      );
    }
  }
);

/* Cancel current user's registration and associated reservations */
router.delete("/:id/registration", requireAuth, async (req: AuthRequest, res) => {
  const conferenceId = req.params.id as string;
  const userId = req.userId;

  if (!isValidId(conferenceId)) {
    res.status(400).json({ message: "Invalid conference ID" });
    return;
  }
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock all conference talks in a stable order so seat promotion
      // cannot race against normal reservation changes.
      const talks = await tx.talk.findMany({
        where: { conferenceId },
        select: { id: true },
        orderBy: { id: "asc" },
      });
      for (const talk of talks) {
        await lockTalk(tx, talk.id);
      }

      const registration = await tx.conferenceRegistration.findUnique({
        where: { userId_conferenceId: { userId, conferenceId } },
        select: { id: true },
      });
      if (!registration) {
        return { status: 404, message: "Registration not found" };
      }

      const reservations = await tx.talkReservation.findMany({
        where: { userId, talk: { conferenceId } },
        select: { id: true, talkId: true, seatNumber: true, checkedInAt: true },
      });
      if (reservations.some((reservation) => reservation.checkedInAt !== null)) {
        return {
          status: 409,
          message: "Cannot cancel registration after a ticket has been checked in.",
        };
      }

      // Remove this attendee from queues before freeing seats.
      await tx.waitlistEntry.deleteMany({
        where: { userId, talk: { conferenceId } },
      });
      await tx.talkReservation.deleteMany({
        where: { userId, talk: { conferenceId } },
      });
      await tx.conferenceRegistration.delete({
        where: { userId_conferenceId: { userId, conferenceId } },
      });

      // Promote eligible waiting attendees into the freed seats.
      for (const reservation of reservations) {
        await promoteFromWaitlist(tx, reservation.talkId, reservation.seatNumber);
      }

      return { status: 200, message: "Registration cancelled successfully" };
    });

    res.status(result.status).json({ message: result.message });
  } catch (error) {
    handleDatabaseError(error, res, "Failed to cancel registration");
  }
});

export default router;
