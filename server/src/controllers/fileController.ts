import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { idSchema } from "../schemas/idSchema";

const prisma = new PrismaClient();

export const getFiles = async (_req: Request, res: Response) => {
  try {
    const files = await prisma.file.findMany({
      select: {
        id: true,
        userId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        s3Url: true,
      },
    });

    res.status(200).json(files);
  } catch (error) {
    console.error("Error fetching all files:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getUserFiles = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const parsedUserId = idSchema.safeParse(userId);
    if (!parsedUserId.success) {
      res.status(400).json({ message: "Controller Parsing Error" });
      return;
    }

    const files = await prisma.file.findMany({
      where: { id: parsedUserId.data },
      select: {
        id: true,
        userId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        s3Url: true,
      },
    });

    res.status(200).json(files);
  } catch (error) {
    console.error("Error fetching files by user ID:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getFileById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      res.status(400).json({ message: "Controller Parsing Error" });
    }

    const file = await prisma.file.findUnique({
      where: { id: parsedId.data },
      select: {
        id: true,
        userId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        s3Url: true,
      },
    });

    if (!file) {
      res.status(404).json({ message: "File not found." });
      return;
    }

    res.status(200).json(file);
  } catch (error) {
    console.error("Error fetching file by ID:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
