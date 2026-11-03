
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

const conferenceSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().optional(),
  location: z.string().trim().min(2),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
}).refine(
  (data) => new Date(data.endsAt) > new Date(data.startsAt),
  {
    message: "End date must be after start date",
    path: ["endsAt"],
  }
);

// Public conferences
router.get("/", async (_req, res) => {
  try {
    const conferences = await prisma.conference.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { startsAt: "asc" },
      include: {
        organizer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    res.json(conferences);
  } catch {
    res.status(500).json({
      message: "Failed to load conferences",
    });
  }
});

// Conferences belonging to the logged-in organizer
router.get("/mine", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || user.role !== "ORGANIZER") {
      res.status(403).json({
        message: "Organizer access required",
      });
      return;
    }

    const conferences = await prisma.conference.findMany({
      where: { organizerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(conferences);
  } catch {
    res.status(500).json({
      message: "Failed to load your conferences",
    });
  }
});

// Create conference
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = conferenceSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid conference data",
      errors: parsed.error.flatten(),
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || user.role !== "ORGANIZER") {
      res.status(403).json({
        message: "Only organizers can create conferences",
      });
      return;
    }

    const conference = await prisma.conference.create({
      data: {
        ...parsed.data,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
        organizerId: user.id,
        status: "DRAFT",
      },
    });

    res.status(201).json(conference);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create conference",
    });
  }
});

// Edit a draft conference
router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  const parsed = conferenceSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid conference data",
      errors: parsed.error.flatten(),
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || user.role !== "ORGANIZER") {
      res.status(403).json({
        message: "Organizer access required",
      });
      return;
    }

    const result = await prisma.conference.updateMany({
      where: {
        id: req.params.id as string,
        organizerId: user.id,
        status: "DRAFT",
      },
      data: {
        ...parsed.data,
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
      where: { id: req.params.id as string},
    });

    res.json(conference);
  } catch {
    res.status(500).json({
      message: "Failed to update conference",
    });
  }
});

// Publish a draft conference
router.patch(
  "/:id/publish",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      if (!user || user.role !== "ORGANIZER") {
        res.status(403).json({
          message: "Organizer access required",
        });
        return;
      }

      const result = await prisma.conference.updateMany({
        where: {
          id: req.params.id as string,
          organizerId: user.id,
          status: "DRAFT",
        },
        data: { status: "PUBLISHED" },
      });

      if (result.count === 0) {
        res.status(404).json({
          message: "Publishable draft conference not found",
        });
        return;
      }

      const conference = await prisma.conference.findUnique({
        where: { id: req.params.id as string },
      });

      res.json(conference);
    } catch {
      res.status(500).json({
        message: "Failed to publish conference",
      });
    }
  }
);

// Delete a draft conference
router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || user.role !== "ORGANIZER") {
      res.status(403).json({
        message: "Organizer access required",
      });
      return;
    }

    const result = await prisma.conference.deleteMany({
      where: {
        id: req.params.id as string,
        organizerId: user.id,
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
  } catch {
    res.status(500).json({
      message: "Failed to delete conference",
    });
  }
});


/* Conference details */

router.get("/:id", async (req, res) => {
    const id = req.params.id as string;
  
    try {
      const conference = await prisma.conference.findFirst({
        where: {
          id,
          status: "PUBLISHED",
        },
        include: {
          organizer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          talks: {
            where: { status: "ACCEPTED" },
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
            orderBy: { startsAt: "asc" },
          },
          _count: {
            select: { registrations: true },
          },
        },
      });
  
      if (!conference) {
        res.status(404).json({
          message: "Conference not found",
        });
        return;
      }
  
      res.json(conference);
    } catch {
      res.status(500).json({
        message: "Failed to load conference",
      });
    }
  });
  
  /* Register for a conference */
  
  router.post(
    "/:id/register",
    requireAuth,
    async (req: AuthRequest, res) => {
      const conferenceId = req.params.id as string;
      const userId = req.userId!;
  
      try {
        const conference = await prisma.conference.findFirst({
          where: {
            id: conferenceId,
            status: "PUBLISHED",
          },
        });
  
        if (!conference) {
          res.status(404).json({
            message: "Conference not found",
          });
          return;
        }
  
        const existing = await prisma.conferenceRegistration.findUnique({
          where: {
            userId_conferenceId: {
              userId,
              conferenceId,
            },
          },
        });
  
        if (existing) {
          res.status(409).json({
            message: "You are already registered for this conference",
          });
          return;
        }
  
        const registration = await prisma.conferenceRegistration.create({
          data: {
            userId,
            conferenceId,
          },
        });
  
        res.status(201).json({
          message: "Registration successful",
          registration,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "Failed to register for conference",
        });
      }
    }
  );
  
  /* Check registration status */
  
  router.get(
    "/:id/registration",
    requireAuth,
    async (req: AuthRequest, res) => {
      const conferenceId = req.params.id as string;
      const userId = req.userId!;
  
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
      } catch {
        res.status(500).json({
          message: "Failed to check registration",
        });
      }
    }
  );
  

export default router;
