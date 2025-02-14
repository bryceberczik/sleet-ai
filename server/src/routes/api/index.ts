import { Router } from "express";
import userRouter from "./userRoutes";
import fileRouter from "./fileRoutes";

const router = Router();

router.use("/user", userRouter);
router.use("/file", fileRouter);

export default router;
