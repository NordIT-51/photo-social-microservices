import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Comment } from "../entity/Comment";
import { serviceAuth } from "../middleware/serviceAuth";

const router = Router();

router.use(serviceAuth);

function parseIdParam(param: string | string[]): number | null {
  const str = Array.isArray(param) ? param[0] : param;
  const id = parseInt(str, 10);
  return isNaN(id) ? null : id;
}

router.get("/comments/by-post/:postId", async (req, res) => {
  try {
    const postId = parseIdParam(req.params.postId);
    if (postId === null) return res.status(400).json({ message: "Invalid post id" });
    const commentRepo = AppDataSource.getRepository(Comment);
    const comments = await commentRepo.find({ where: { postId } });
    return res.json(comments);
  } catch (error) {
    console.error("[comment-service] internal by-post error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.get("/comments/count/:postId", async (req, res) => {
  try {
    const postId = parseIdParam(req.params.postId);
    if (postId === null) return res.status(400).json({ message: "Invalid post id" });
    const commentRepo = AppDataSource.getRepository(Comment);
    const count = await commentRepo.count({ where: { postId } });
    return res.json({ count });
  } catch (error) {
    console.error("[comment-service] internal count error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.delete("/comments/by-post/:postId", async (req, res) => {
  try {
    const postId = parseIdParam(req.params.postId);
    if (postId === null) return res.status(400).json({ message: "Invalid post id" });
    const commentRepo = AppDataSource.getRepository(Comment);
    const result = await commentRepo.delete({ postId });
    return res.json({ deleted: result.affected || 0 });
  } catch (error) {
    console.error("[comment-service] internal delete-by-post error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.delete("/comments/by-user/:userId", async (req, res) => {
  try {
    const userId = parseIdParam(req.params.userId);
    if (userId === null) return res.status(400).json({ message: "Invalid user id" });
    const commentRepo = AppDataSource.getRepository(Comment);
    const result = await commentRepo.delete({ userId });
    return res.json({ deleted: result.affected || 0 });
  } catch (error) {
    console.error("[comment-service] internal delete-by-user error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

export default router;