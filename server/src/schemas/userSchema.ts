import { z } from "zod";

export const usernameSchema = z.string().min(3).max(20);
export const emailSchema = z.string().email();
export const passwordSchema = z
  .string()
  .min(8)
  .max(20)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/\d/)
  .regex(/[@$!%*?&]/);
export const hasPremiumSchema = z.boolean();
