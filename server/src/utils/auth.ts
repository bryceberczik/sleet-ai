import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
} from "../schemas/userSchema";
import jwt, {
  JwtPayload,
  VerifyErrors,
  TokenExpiredError,
  JsonWebTokenError,
} from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const secretKey = process.env.JWT_SECRET_KEY!;
const prisma = new PrismaClient();

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader) {
      res.status(401).json({ message: "Authorization header is missing." });
      return;
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(
      token,
      secretKey,
      (err: VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
        if (err) {
          let message = "";
          if (err instanceof TokenExpiredError) message = "Token is expired.";
          if (err instanceof JsonWebTokenError) message = "Token is invalid.";
          res.status(403).json({ message });
          return;
        }

        if (!decoded || typeof decoded === "string") {
          res.status(403).json({ message: "Malformed token payload." });
          return;
        }

        req.user = decoded as JwtPayload;
        next();
      }
    );
  } catch (error) {
    console.error("Error authenticating token:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
