import { Router } from "express";
import {
  getFiles,
  getUserFiles,
  getFileById,
  uploadFile,
  removeFile,
  downloadFile,
} from "../../controllers/fileController";
import upload from "../../config/upload";

const router = Router();

router.get("/", getFiles);
router.get("/userid/:userId", getUserFiles);
router.get("/id/:id", getFileById);
router.post("/", upload.single("file"), uploadFile);
router.delete("/:id", removeFile);
router.get("/download/:id", downloadFile);

export default router;
