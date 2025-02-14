import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { idSchema } from "../schemas/idSchema";
import AWS from "../config/awsConfig";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const s3 = new AWS.S3();
const bucket = process.env.BUCKET_NAME!;

export const getFiles = async (_req: Request, res: Response) => {
  try {
    const files = await prisma.file.findMany({
      select: {
        id: true,
        userId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
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
      where: { userId: parsedUserId.data },
      select: {
        id: true,
        userId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
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
      return;
    }

    const file = await prisma.file.findUnique({
      where: { id: parsedId.data },
      select: {
        id: true,
        userId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
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

export const uploadFile = async (req: Request, res: Response) => {
  const { userId } = req.body;

  try {
    const parsedUserId = idSchema.safeParse(userId);
    if (!parsedUserId.success) {
      res.status(400).json({ message: "Controller Parsing Error" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded." });
      return;
    }

    const existingUser = prisma.user.findUnique({
      where: { id: parsedUserId.data },
    });
    if (!existingUser) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const bucketParams = {
      Bucket: bucket,
      Key: `${parsedUserId.data}/${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    await s3.upload(bucketParams).promise();
    const newFile = await prisma.file.create({
      data: {
        userId: parsedUserId.data,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
      select: {
        id: true,
        userId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
      },
    });

    res.status(201).json(newFile);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const removeFile = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const parsedId = idSchema.safeParse(id);
    const parsedUserId = idSchema.safeParse(userId);
    if (!parsedId.success || !parsedUserId.success) {
      res.status(400).json({ message: "Controller Parsing Error" });
      return;
    }

    const existingUser = prisma.user.findUnique({
      where: { id: parsedUserId.data },
    });
    if (!existingUser) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const existingFile = await prisma.file.findUnique({
      where: { id: parsedId.data },
    });
    if (!existingFile) {
      res.status(404).json({ message: "File not found." });
      return;
    }

    if (parsedUserId.data !== existingFile.userId) {
      res.status(403).json({ message: "Unauthorized access." });
      return;
    }

    const bucketParams = {
      Bucket: bucket,
      Key: `${parsedUserId.data}/${existingFile.fileName}`,
    };

    await s3.deleteObject(bucketParams).promise();
    const deletedFile = await prisma.file.delete({
      where: { id: parsedId.data },
    });

    res.status(200).json({ success: !!deletedFile });
  } catch (error) {
    console.error("Error deleting file", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const downloadFile = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const parsedId = idSchema.safeParse(id);
    const parsedUserId = idSchema.safeParse(userId);
    if (!parsedId.success || !parsedUserId.success) {
      res.status(400).json({ message: "Controller Parsing Error" });
      return;
    }

    const existingFile = await prisma.file.findUnique({
      where: { id: parsedId.data },
    });
    if (!existingFile) {
      res.status(404).json({ message: "File not found." });
      return;
    }

    if (parsedUserId.data !== existingFile.userId) {
      res.status(403).json({ message: "Unauthorized access." });
      return;
    }

    const bucketParams = {
      Bucket: bucket,
      Key: `${parsedUserId.data}/${existingFile.fileName}`,
    };

    const fileStream = s3.getObject(bucketParams).createReadStream();
    res.setHeader("Content-Type", existingFile.fileType);

    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
