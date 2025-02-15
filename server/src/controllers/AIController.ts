import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { AIRequestSchema } from "../schemas/AISchema";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/awsConfig";
import dotenv from "dotenv";

// * File Parsers * //
import YAML from "yaml";
import { parse as csvParse } from "csv-parse";
import { deserialize as bsonParse } from "bson";

dotenv.config();

const prisma = new PrismaClient();
const apiKey = process.env.OPENAI_API_KEY!;
const bucket = process.env.BUCKET_NAME!;

const chooseModel = (hasPremium: boolean) => {
  let AIModel = "gpt-4o";
  if (hasPremium) AIModel = "o1";

  return new ChatOpenAI({
    temperature: 0,
    openAIApiKey: apiKey,
    model: AIModel,
  });
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
    if (!s3Response.Body || !s3Response.ContentType) {
      res
        .status(404)
        .json({ message: "S3 Response Body and/or Content Type not found." });
      return;
    }

    const stringBody = await s3Response.Body.transformToString("utf-8");

    const fileType = s3Response.ContentType;
    let fileData;

    switch (fileType) {
      case "application/json":
        fileData = JSON.parse(stringBody);
        break;

      case "application/yaml":
      case "text/yaml":
        fileData = YAML.parse(stringBody);
        break;

      case "text/csv":
        (fileData = csvParse(stringBody)), { columms: true };
        break;

      case "application/bson":
        const byteArray = await s3Response.Body.transformToByteArray();
        fileData = bsonParse(byteArray);
        break;

      default:
        res
          .status(400)
          .json({ message: `Unsupported file type of ${fileType}.` });
        return;
    }

    const formattedInput = await promptTemplate.format({
      file_data: fileData,
      file_type: fileType,
      user_prompt: parsedRequest.data.prompt,
      response_mode: parsedRequest.data.mode,
    });

    const chosenModel = chooseModel(parsedRequest.data.hasPremium);
    const response = await chosenModel.invoke(formattedInput);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error generating AI response:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
