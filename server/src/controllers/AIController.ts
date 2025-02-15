import { Request, Response } from "express";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";

dotenv.config();

type AIModelType = "gpt-4o" | "o1";
const apiKey = process.env.OPENAI_API_KEY!;

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
  const { prompt, mode } = req.body;
}
