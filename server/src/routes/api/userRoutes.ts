import { Router } from "express";
import {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
} from "../../controllers/userController";

const router = Router();

router.get("/", getUsers);
router.get("/id/:id", getUserById);
router.get("/email/:email", getUserByEmail);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
