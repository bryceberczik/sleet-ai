import { Router } from "express";
import userRouter from "./userRoutes";
import fileRouter from "./fileRoutes";
import AIRouter from "./AIRoutes";

const router = Router();

router.use("/user", userRouter);
router.use("/file", fileRouter);
router.use("/ai", AIRouter);

export default router;
