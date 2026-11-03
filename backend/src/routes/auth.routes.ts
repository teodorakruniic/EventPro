
import { Router } from "express";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "../lib/auth.js";

const router = Router();

// Registration validation
const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z
    .enum(["ATTENDEE", "SPEAKER", "ORGANIZER"])
    .default("ATTENDEE"),
});

// Register a new user
router.post("/register", async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid registration data",
      errors: result.error.flatten(),
    });
    return;
  }

  const {
    firstName,
    lastName,
    email,
    password,
    role,
  } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        message: "Email is already registered",
      });
      return;
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: "Registration successful",
      user,
      token,
    });
  } catch (error) {
    console.error("Registration failed:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Login validation
const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

// Login existing user
router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid login data",
    });
    return;
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = generateToken(user.id);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login failed:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
