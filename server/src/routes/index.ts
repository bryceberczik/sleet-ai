import { Router } from "express";
import apiRouter from "./api/index";
import authRouter from "./auth/authRoutes";
import { authenticateToken } from "../utils/auth";

const router = Router();

router.use(
  "/api",
  // authenticateToken,
  apiRouter
);
router.use("/auth", authRouter);

export default router;
