
import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

const uuidSchema = z.string().uuid();

const proposalSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(20).max(5000),
  conferenceId: z.string().uuid(),
});

const updateProposalSchema = proposalSchema.pick({
  title: true,
  description: true,
});

const reviewSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

async function getUser(req: AuthRequest) {
  if (!req.userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      role: true,
    },
  });
}

function handleError(res: Response, error: unknown) {
  console.error("Talk route error:", error);

  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
}

/*
 * GET /api/talks/my
 * Speaker: list personal proposals.
 */
router.get(
  "/my",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const user = await getUser(req);

      if (!user || user.role !== "SPEAKER") {
        res.status(403).json({
          message: "Only speakers can access their proposals.",
        });
        return;
      }

      const talks = await prisma.talk.findMany({
        where: {
          speakerId: user.id,
        },
        include: {
          conference: {
            select: {
              id: true,
              title: true,
              location: true,
              startsAt: true,
              endsAt: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(talks);
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * GET /api/talks/conference/:conferenceId
 * Public: list accepted talks for a published conference.
 */
router.get("/conference/:conferenceId", async (req, res) => {
  const parsedId = uuidSchema.safeParse(
    req.params.conferenceId
  );

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
      },
      include: {
        speaker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { startsAt: "asc" },
        { createdAt: "asc" },
      ],
    });

    res.json(talks);
  } catch (error) {
    handleError(res, error);
  }
});

/*
 * GET /api/talks/review/:conferenceId
 * Organizer: review proposals for their own conference.
 */
router.get(
  "/review/:conferenceId",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsedId = uuidSchema.safeParse(
      req.params.conferenceId
    );

    if (!parsedId.success) {
      res.status(400).json({
        message: "Invalid conference ID.",
      });
      return;
    }

    try {
      const user = await getUser(req);

      if (!user || user.role !== "ORGANIZER") {
        res.status(403).json({
          message: "Organizer access required.",
        });
        return;
      }

      const conference = await prisma.conference.findUnique({
        where: {
          id: parsedId.data,
        },
        select: {
          id: true,
          organizerId: true,
          title: true,
          status: true,
        },
      });

      if (!conference) {
        res.status(404).json({
          message: "Conference not found.",
        });
        return;
      }

      if (conference.organizerId !== user.id) {
        res.status(403).json({
          message: "You do not manage this conference.",
        });
        return;
      }

      const talks = await prisma.talk.findMany({
        where: {
          conferenceId: conference.id,
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
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(talks);
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * POST /api/talks
 * Speaker: submit a new proposal.
 */
router.post(
  "/",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsed = proposalSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid proposal data.",
        errors: parsed.error.flatten(),
      });
      return;
    }

    try {
      const user = await getUser(req);

      if (!user || user.role !== "SPEAKER") {
        res.status(403).json({
          message: "Only speakers can submit proposals.",
        });
        return;
      }

      const conference = await prisma.conference.findUnique({
        where: {
          id: parsed.data.conferenceId,
        },
      });

      if (!conference) {
        res.status(404).json({
          message: "Conference not found.",
        });
        return;
      }

      if (conference.status !== "PUBLISHED") {
        res.status(409).json({
          message:
            "Proposals can only be submitted to published conferences.",
        });
        return;
      }

      if (conference.startsAt <= new Date()) {
        res.status(409).json({
          message:
            "This conference has already started.",
        });
        return;
      }

      const talk = await prisma.talk.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          conferenceId: conference.id,
          speakerId: user.id,
          status: "PENDING",
        },
        include: {
          conference: {
            select: {
              id: true,
              title: true,
              location: true,
              startsAt: true,
            },
          },
        },
      });

      res.status(201).json(talk);
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * PATCH /api/talks/:id
 * Speaker: edit their own pending proposal.
 */
router.patch(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsedId = uuidSchema.safeParse(req.params.id);
    const parsedBody = updateProposalSchema.safeParse(req.body);

    if (!parsedId.success || !parsedBody.success) {
      res.status(400).json({
        message: "Invalid proposal data.",
      });
      return;
    }

    try {
      const user = await getUser(req);

      if (!user || user.role !== "SPEAKER") {
        res.status(403).json({
          message: "Speaker access required.",
        });
        return;
      }

      const talk = await prisma.talk.findUnique({
        where: {
          id: parsedId.data,
        },
        include: {
          conference: true,
        },
      });

      if (!talk) {
        res.status(404).json({
          message: "Proposal not found.",
        });
        return;
      }

      if (talk.speakerId !== user.id) {
        res.status(403).json({
          message:
            "You can only edit your own proposals.",
        });
        return;
      }

      if (talk.status !== "PENDING") {
        res.status(409).json({
          message:
            "Only pending proposals can be edited.",
        });
        return;
      }

      if (
        talk.conference.status !== "PUBLISHED" ||
        talk.conference.startsAt <= new Date()
      ) {
        res.status(409).json({
          message:
            "This conference is no longer accepting proposal changes.",
        });
        return;
      }

      const updated = await prisma.talk.updateMany({
        where: {
          id: talk.id,
          speakerId: user.id,
          status: "PENDING",
          conference: {
            status: "PUBLISHED",
            startsAt: {
              gt: new Date(),
            },
          },
        },
        data: {
          title: parsedBody.data.title,
          description: parsedBody.data.description,
        },
      });

      if (updated.count === 0) {
        res.status(409).json({
          message:
            "This proposal can no longer be edited.",
        });
        return;
      }

      const result = await prisma.talk.findUnique({
        where: {
          id: talk.id,
        },
        include: {
          conference: {
            select: {
              id: true,
              title: true,
              location: true,
              startsAt: true,
              endsAt: true,
              status: true,
            },
          },
        },
      });

      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  }
);

/*
 * DELETE /api/talks/:id
 * Speaker: withdraw their own pending proposal.
 */
router.delete(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsedId = uuidSchema.safeParse(req.params.id);

    if (!parsedId.success) {
      res.status(400).json({
        message: "Invalid proposal ID.",
      });
      return;
    }

    try {
      const user = await getUser(req);

      if (!user || user.role !== "SPEAKER") {
        res.status(403).json({
          message: "Speaker access required.",
        });
        return;
      }

      const talk = await prisma.talk.findUnique({
        where: {
          id: parsedId.data,
        },
      });

      if (!talk) {
        res.status(404).json({
          message: "Proposal not found.",
        });
        return;
      }

      if (talk.speakerId !== user.id) {
        res.status(403).json({
          message:
            "You can only withdraw your own proposals.",
        });
        return;
      }

      if (talk.status !== "PENDING") {
        res.status(409).json({
          message:
            "Only pending proposals can be withdrawn.",
        });
        return;
      }

      const deleted = await prisma.talk.deleteMany({
        where: {
          id: talk.id,
          speakerId: user.id,
          status: "PENDING",
        },
      });

      if (deleted.count === 0) {
        res.status(409).json({
          message:
            "This proposal has already been reviewed.",
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
 * PATCH /api/talks/:id/review
 * Organizer: accept or reject a pending proposal.
 */
router.patch(
  "/:id/review",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsedId = uuidSchema.safeParse(req.params.id);
    const parsedBody = reviewSchema.safeParse(req.body);

    if (!parsedId.success || !parsedBody.success) {
      res.status(400).json({
        message: "Invalid review data.",
      });
      return;
    }

    try {
      const user = await getUser(req);

      if (!user || user.role !== "ORGANIZER") {
        res.status(403).json({
          message: "Organizer access required.",
        });
        return;
      }

      const talk = await prisma.talk.findUnique({
        where: {
          id: parsedId.data,
        },
        include: {
          conference: {
            select: {
              id: true,
              organizerId: true,
              status: true,
              startsAt: true,
            },
          },
        },
      });

      if (!talk) {
        res.status(404).json({
          message: "Proposal not found.",
        });
        return;
      }

      if (talk.conference.organizerId !== user.id) {
        res.status(403).json({
          message:
            "You cannot review this proposal.",
        });
        return;
      }

      if (talk.status !== "PENDING") {
        res.status(409).json({
          message:
            "This proposal has already been reviewed.",
        });
        return;
      }

      if (talk.conference.status !== "PUBLISHED") {
        res.status(409).json({
          message:
            "Only published conferences can review proposals.",
        });
        return;
      }

      if (talk.conference.startsAt <= new Date()) {
        res.status(409).json({
          message:
            "This conference has already started.",
        });
        return;
      }

      const updated = await prisma.talk.updateMany({
        where: {
          id: talk.id,
          status: "PENDING",
          conference: {
            organizerId: user.id,
            status: "PUBLISHED",
            startsAt: {
              gt: new Date(),
            },
          },
        },
        data: {
          status: parsedBody.data.status,
        },
      });

      if (updated.count === 0) {
        res.status(409).json({
          message:
            "This proposal can no longer be reviewed.",
        });
        return;
      }

      const result = await prisma.talk.findUnique({
        where: {
          id: talk.id,
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
          conference: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  }
);

export default router;
