import { z } from "zod";
import { idSchema } from "./idSchema";

export const AIRequestSchema = z.object({
  id: idSchema,
  fileId: idSchema,
  prompt: z.string().max(500),
  mode: z.enum(["concise", "default", "verbose"]),
  hasPremium: z.boolean(),
});
