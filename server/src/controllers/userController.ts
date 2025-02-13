import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { idSchema } from "../schemas/idSchema";
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
  hasPremiumSchema,
} from "../schemas/userSchema";

const prisma = new PrismaClient();

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        hasPremium: true,
        myFiles: true,
      },
    });

    if (!users) {
      res.status(404).json({ message: "No users found." });
      return;
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const parsedId = idSchema.safeParse(id);
    if (parsedId.success) {
      res.status(400).json({ message: "Controller Parsing Error" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: parsedId.data },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        hasPremium: true,
        myFiles: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getUserByEmail = async (req: Request, res: Response) => {
  const { email } = req.params;

  try {
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      res.status(400).json({ message: "Controller Parsing Error" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: parsedEmail.data },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        hasPremium: true,
        myFiles: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
