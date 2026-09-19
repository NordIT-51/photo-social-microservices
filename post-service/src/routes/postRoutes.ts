import { Router } from "express";
import { PostController } from "../controller/PostController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, PostController.createPost);
router.get("/feed", authenticate, PostController.getFeed);
router.get("/:id", authenticate, PostController.getPostById);
router.delete("/:id", authenticate, PostController.deletePost);
router.post("/:id/like", authenticate, PostController.likePost);
router.delete("/:id/like", authenticate, PostController.unlikePost);
router.post("/:id/favorite", authenticate, PostController.favoritePost);
router.delete("/:id/favorite", authenticate, PostController.unfavoritePost);

export default router;