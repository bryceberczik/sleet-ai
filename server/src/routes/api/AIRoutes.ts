import { Router } from "express";
import { generateAIResponse } from "../../controllers/AIController";

const router = Router();

router.post("/:id", generateAIResponse);

export default router;
