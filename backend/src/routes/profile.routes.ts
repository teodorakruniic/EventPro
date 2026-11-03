
import { Router } from "express";
import type { Response } from "express";
import multer from "multer";
import argon2 from "argon2";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

const uploadDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "avatars"
);

const publicProfileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  avatarUrl: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
} as const;

const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(2).max(100).optional(),
    lastName: z.string().trim().min(2).max(100).optional(),
    email: z.email().trim().toLowerCase().optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided."
  );

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, _file, callback) => {
    callback(null, `${randomUUID()}.upload`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(
        new Error("Only JPG, PNG and WebP images are allowed.")
      );
      return;
    }

    callback(null, true);
  },
});

function handleError(res: Response, error: unknown) {
  console.error("Profile error:", error);

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    res.status(409).json({
      message: "This email address is already in use.",
    });
    return;
  }

  res.status(500).json({
    message: "Internal server error.",
  });
}

function localAvatarPath(avatarUrl: string | null) {
  if (!avatarUrl) return null;

  const prefix = "/uploads/avatars/";

  if (!avatarUrl.startsWith(prefix)) return null;

  const filename = avatarUrl.slice(prefix.length);

  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/i.test(filename)) {
    return null;
  }

  return path.join(uploadDirectory, filename);
}

async function deleteLocalAvatar(avatarUrl: string | null) {
  const filePath = localAvatarPath(avatarUrl);

  if (!filePath) return;

  await fs.unlink(filePath).catch((error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    console.error("Unable to delete avatar file:", error);
  });
}

// GET /api/profile/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: publicProfileSelect,
    });

    if (!user) {
      res.status(404).json({
        message: "User not found.",
      });
      return;
    }

    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
});

// PATCH /api/profile/me
router.patch("/me", requireAuth, async (req: AuthRequest, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid profile data.",
      errors: parsed.error.flatten(),
    });
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: parsed.data,
      select: publicProfileSelect,
    });

    res.json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// PATCH /api/profile/password
router.patch(
  "/password",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid password data.",
      });
      return;
    }

    const { currentPassword, newPassword } = parsed.data;

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          passwordHash: true,
        },
      });

      if (!user) {
        res.status(404).json({
          message: "User not found.",
        });
        return;
      }

      const valid = await argon2.verify(
        user.passwordHash,
        currentPassword
      );

      if (!valid) {
        res.status(400).json({
          message: "Current password is incorrect.",
        });
        return;
      }

      if (currentPassword === newPassword) {
        res.status(400).json({
          message: "New password must be different.",
        });
        return;
      }

      const newHash = await argon2.hash(newPassword);

      const updated = await prisma.user.updateMany({
        where: {
          id: user.id,
          passwordHash: user.passwordHash,
        },
        data: {
          passwordHash: newHash,
        },
      });

      if (updated.count !== 1) {
        res.status(409).json({
          message: "Password changed during this request. Try again.",
        });
        return;
      }

      res.json({
        message: "Password changed successfully.",
      });
    } catch (error) {
      handleError(res, error);
    }
  }
);

// POST /api/profile/avatar
router.post(
  "/avatar",
  requireAuth,
  (req: AuthRequest, res, next) => {
    upload.single("avatar")(req, res, (error: unknown) => {
      if (error) {
        res.status(400).json({
          message:
            error instanceof Error
              ? error.message
              : "Invalid image upload.",
        });
        return;
      }

      next();
    });
  },
  async (req: AuthRequest, res) => {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        message: "Please select an image.",
      });
      return;
    }

    try {
      const bytes = await fs.readFile(file.path);

      const jpeg =
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff;

      const png =
        bytes.subarray(0, 8).equals(
          Buffer.from([
            137, 80, 78, 71, 13, 10, 26, 10,
          ])
        );

      const webp =
        bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WEBP";

      const extension = jpeg
        ? "jpg"
        : png
          ? "png"
          : webp
            ? "webp"
            : null;

      if (!extension) {
        await fs.unlink(file.path);

        res.status(400).json({
          message: "The uploaded file is not a valid image.",
        });
        return;
      }

      const filename = `${randomUUID()}.${extension}`;
      const destination = path.join(
        uploadDirectory,
        filename
      );

      await fs.rename(file.path, destination);

      const avatarUrl = `/uploads/avatars/${filename}`;

      let previousAvatar: string | null = null;

      try {
        const updated = await prisma.$transaction(async (tx) => {
          const existing = await tx.user.findUnique({
            where: { id: req.userId },
            select: { avatarUrl: true },
          });

          if (!existing) {
            return null;
          }

          previousAvatar = existing.avatarUrl;

          return tx.user.update({
            where: { id: req.userId },
            data: { avatarUrl },
            select: publicProfileSelect,
          });
        });

        if (!updated) {
          await fs.unlink(destination);

          res.status(404).json({
            message: "User not found.",
          });
          return;
        }

        await deleteLocalAvatar(previousAvatar);

        res.json({
          message: "Profile picture updated successfully.",
          user: updated,
        });
      } catch (error) {
        await fs.unlink(destination).catch(() => undefined);
        throw error;
      }
    } catch (error) {
      await fs.unlink(file.path).catch(() => undefined);
      handleError(res, error);
    }
  }
);

// DELETE /api/profile/avatar
router.delete(
  "/avatar",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { avatarUrl: true },
      });

      if (!user) {
        res.status(404).json({
          message: "User not found.",
        });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: req.userId },
        data: { avatarUrl: null },
        select: publicProfileSelect,
      });

      await deleteLocalAvatar(user.avatarUrl);

      res.json({
        message: "Profile picture removed successfully.",
        user: updated,
      });
    } catch (error) {
      handleError(res, error);
    }
  }
);

export default router;
