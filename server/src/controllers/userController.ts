import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { idSchema } from "../schemas/idSchema";
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
} from "../schemas/userSchema";
import bcrypt from "bcrypt";

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
    if (!parsedId.success) {
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

export const createUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    const parsedUsername = usernameSchema.safeParse(username);
    const parsedEmail = emailSchema.safeParse(email);
    const parsedPassword = passwordSchema.safeParse(password);
    if (
      !parsedUsername.success ||
      !parsedEmail.success ||
      !parsedPassword.success
    ) {
      res.status(400).json({ message: "Controller Parsing Error" });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(parsedPassword.data, saltRounds);

    const existingUser = await prisma.user.findUnique({
      where: { email: parsedEmail.data },
    });

    if (existingUser) {
      res.status(409).json({ message: "User with this email already exists." });
      return;
    }

    const newUser = await prisma.user.create({
      data: {
        username: parsedUsername.data,
        email: parsedEmail.data,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        hasPremium: true,
        myFiles: true,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  try {
    const parsedId = idSchema.safeParse(id);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedId.success || !parsedPassword.success) {
      res.status(400).json({ message: "Controller Parsing Error" });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: parsedId.data },
    });

    if (!existingUser) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const passwordIsValid = await bcrypt.compare(
      parsedPassword.data,
      existingUser.password
    );

    if (!passwordIsValid) {
      res.status(401).json({ message: "Passwords do not match." });
      return;
    }

    let newUsername = null;
    if (username) {
      const parsedUsername = usernameSchema.safeParse(username);
      if (!parsedUsername.success) {
        res.status(400).json({ message: "Controller Parsing Error" });
        return;
      }

      if (parsedUsername.data === existingUser.username) {
        res.status(409).json({
          message: "Provided username is already user's current username.",
        });
        return;
      }
      newUsername = parsedUsername.data;
    }

    let newEmail = null;
    if (email) {
      const parsedEmail = emailSchema.safeParse(email);
      if (!parsedEmail.success) {
        res.status(400).json({ message: "Controller Parsing Error" });
        return;
      }

      if (parsedEmail.data === existingUser.email) {
        res
          .status(409)
          .json({ message: "Provided email is already user's current email." });
        return;
      }
      newEmail = parsedEmail.data;
    }

    const updateData: any = {};
    if (newUsername !== null) updateData.username = newUsername;
    if (newEmail !== null) updateData.email = newEmail;

    const updatedUser = await prisma.user.update({
      where: { id: parsedId.data },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        hasPremium: true,
        myFiles: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    const parsedId = idSchema.safeParse(id);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedId.success || !parsedPassword.success) {
      res.status(400).json({ message: "Controller Parsing Error" });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: parsedId.data },
    });

    if (!existingUser) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const passwordIsValid = await bcrypt.compare(
      parsedPassword.data,
      existingUser.password
    );

    if (!passwordIsValid) {
      res.status(401).json({ message: "Passwords do not match." });
      return;
    }

    await prisma.user.delete({ where: { id } });

    res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
