
import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
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

router.get("/", async (_req, res) => {
  try {
    const conferences = await prisma.conference.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        startsAt: "asc",
      },
      include: conferenceInclude,
    });

    res.json(conferences);
  } catch (error) {
    handleDatabaseError(
      error,
      res,
      "Failed to load conferences"
    );
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

/* Cancel current user's registration */

router.delete(
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
      const existing =
        await prisma.conferenceRegistration.findUnique({
          where: {
            userId_conferenceId: {
              userId,
              conferenceId,
            },
          },
        });

      if (!existing) {
        res.status(404).json({
          message: "Registration not found",
        });
        return;
      }

      await prisma.conferenceRegistration.delete({
        where: {
          userId_conferenceId: {
            userId,
            conferenceId,
          },
        },
      });

      res.json({
        message: "Registration cancelled successfully",
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        res.status(404).json({
          message: "Registration not found",
        });
        return;
      }

      handleDatabaseError(
        error,
        res,
        "Failed to cancel registration"
      );
    }
  }
);

export default router;
