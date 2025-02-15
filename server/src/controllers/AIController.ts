import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { AIRequestSchema } from "../schemas/AISchema";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/awsConfig";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const apiKey = process.env.OPENAI_API_KEY!;
const bucket = process.env.BUCKET_NAME!;

type AIModelType = "gpt-4o" | "o1";

const chooseModel = (AIModel: AIModelType) => {
  const model = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: apiKey,
    model: AIModel,
  });

  return model;
};

const promptTemplate = new PromptTemplate({
  template:
    "Your name is Sleet AI. Your job is to analyze files containing data and identify common patterns and points of interests. You will be given a file and its file type. Expect the following file types: JSON, CSV, YAML, XML, BSON, NDJSON, Avro, and Parquet. You will also be given a prompt by the user containing specific instructions on what and/or how to analyze the given file. If the prompt is unrelated to analyzing the given file, notify the user in a friendly manner that your only job is to analyze file data. If the prompt is related to analyzing a file but the prompt seems to be referencing a different file, notify the user that they may have chosen the wrong file to anaylze; unless specified otherwise. You will also be given a response mode (concise, default, or verbose) that specifies the length of the response you should return. If concise, keep your response under a paragraph, and if verbose, go into great detail in your response. Here are your variables:\nFile Data: {file_data}\nFile Type: {file_type}\nUser Prompt: {user_prompt}\nResponse Mode: {response_mode}",
  inputVariables: ["file_data", "file_type", "user_prompt", "response_mode"],
});

export const generateAIResponse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fileId, prompt, mode, hasPremium } = req.body;

  try {
    const parsedRequest = AIRequestSchema.safeParse({
      id,
      fileId,
      prompt,
      mode,
      hasPremium,
    });

    if (!parsedRequest.success) {
      res.status(400).json({ message: "Controller Parsing Error" });
      return;
    }

    const existingFile = await prisma.file.findUnique({
      where: { id: parsedRequest.data.fileId },
    });

    if (!existingFile) {
      res.status(404).json({ message: "File not found." });
      return;
    }

    const bucketParams = {
      Bucket: bucket,
      Key: `${parsedRequest.data.id}/${existingFile.fileName}`,
    };

    const s3Response = await s3Client.send(new GetObjectCommand(bucketParams));

    if (!s3Response.Body) {
      res.status(404).json({ message: "S3 Response Body not found." });
      return;
    }
  } catch (error) {}
};
