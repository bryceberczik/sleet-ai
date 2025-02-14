import { Router } from "express";
import apiRouter from "./api/index";

const router = Router();

router.use("/api", apiRouter);

export default router;
