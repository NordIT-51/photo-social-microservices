import { Router } from "express";
import { SocialController } from "../controller/SocialController";
import { serviceAuth } from "../middleware/serviceAuth";

const router = Router();

router.use(serviceAuth);

router.get("/follows/following/:userId", SocialController.internalGetFollowing);
router.get("/follows/followers/:userId", SocialController.internalGetFollowers);

export default router;