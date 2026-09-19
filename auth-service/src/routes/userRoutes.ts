import { Router } from "express";
import { UserController } from "../controller/UserController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/profile", authenticate, UserController.getProfile);
router.post("/avatar", authenticate, UserController.updateAvatar);

export default router;