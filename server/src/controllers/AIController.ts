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
