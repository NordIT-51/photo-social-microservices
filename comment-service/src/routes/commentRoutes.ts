import { Router } from "express";
import { CommentController } from "../controller/CommentController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/posts/:postId/comments", authenticate, CommentController.addComment);
router.get("/posts/:postId/comments", authenticate, CommentController.getCommentsByPost);
router.delete("/comments/:id", authenticate, CommentController.deleteComment);

export default router;