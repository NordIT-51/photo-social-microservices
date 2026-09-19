import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Post } from "../entity/Post";
import { serviceAuth } from "../middleware/serviceAuth";

const router = Router();

router.use(serviceAuth);

function parseIdParam(param: string | string[]): number | null {
  const str = Array.isArray(param) ? param[0] : param;
  const id = parseInt(str, 10);
  return isNaN(id) ? null : id;
}

router.get("/posts/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) return res.status(400).json({ message: "Invalid id" });
    const postRepo = AppDataSource.getRepository(Post);
    const post = await postRepo.findOne({ where: { id } });
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.json(post);
  } catch (error) {
    console.error("[post-service] internal getPost error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.get("/posts/:id/exists", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) return res.status(400).json({ message: "Invalid id" });
    const postRepo = AppDataSource.getRepository(Post);
    const count = await postRepo.count({ where: { id } });
    return res.json({ exists: count > 0 });
  } catch (error) {
    console.error("[post-service] internal exists error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.get("/posts/by-user/:userId", async (req, res) => {
  try {
    const userId = parseIdParam(req.params.userId);
    if (userId === null) return res.status(400).json({ message: "Invalid user id" });
    const postRepo = AppDataSource.getRepository(Post);
    const posts = await postRepo.find({ where: { userId }, order: { createdAt: "DESC" } });
    return res.json(posts);
  } catch (error) {
    console.error("[post-service] internal by-user error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.delete("/posts/by-user/:userId", async (req, res) => {
  try {
    const userId = parseIdParam(req.params.userId);
    if (userId === null) return res.status(400).json({ message: "Invalid user id" });
    const postRepo = AppDataSource.getRepository(Post);
    const result = await postRepo.delete({ userId });
    return res.json({ deleted: result.affected || 0 });
  } catch (error) {
    console.error("[post-service] internal delete-by-user error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

export default router;