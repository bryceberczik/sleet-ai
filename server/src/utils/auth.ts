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
          let message = "Unknown Token Error";
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

export const signUp = async (req: Request, res: Response) => {
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
      res.status(400).json({ message: "Auth Parsing Error" });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsedEmail.data },
    });

    if (existingUser) {
      res.status(403).json({ message: "User with this email already exists." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(parsedPassword.data, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        username: parsedUsername.data,
        email: parsedEmail.data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        hasPremium: true,
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, hasPremium: newUser.hasPremium },
      secretKey,
      { expiresIn: "7d" }
    );

    res.status(201).json(token);
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
