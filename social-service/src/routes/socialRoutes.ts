import { Router } from "express";
import { SocialController } from "../controller/SocialController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/follow/:followingId", authenticate, SocialController.follow);
router.delete("/follow/:followingId", authenticate, SocialController.unfollow);

router.get("/notifications", authenticate, SocialController.getNotifications);
router.put("/notifications/:id/read", authenticate, SocialController.markAsRead);

export default router;