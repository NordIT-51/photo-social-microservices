import { Response } from "express";
import path from "path";
import multer from "multer";
import fs from "fs/promises";
import { AppDataSource } from "../data-source";
import { Post } from "../entity/Post";
import { Like } from "../entity/Like";
import { Favorite } from "../entity/Favorite";
import { AuthRequest } from "../middleware/auth";
import { ensureUploadDirs, processPostPhoto } from "../utils/imageProcessor";
import { getUserById, getUsersBatch } from "../utils/authClient";
import { publishEvent } from "../utils/rabbitmq";

const upload = multer({ dest: path.join(process.cwd(), "temp-uploads") });

function parseIdParam(param: string | string[]): number | null {
  const str = Array.isArray(param) ? param[0] : param;
  const id = parseInt(str, 10);
  return isNaN(id) ? null : id;
}

export class PostController {
  static async createPost(req: AuthRequest, res: Response): Promise<Response> {
    return new Promise((resolve) => {
      const multerUpload = upload.single("photo");
      multerUpload(req as any, res as any, async (err: any) => {
        if (err) {
          resolve(res.status(400).json({ message: err.message }));
          return;
        }
        const file = (req as any).file;
        if (!file) {
          resolve(res.status(400).json({ message: "Photo required" }));
          return;
        }
        const description = req.body.description || null;
        try {
          await ensureUploadDirs();
          const baseName = `${req.userId}_${Date.now()}`;
          const { originalPath, previewPath } = await processPostPhoto(file.path, baseName);
          const postRepo = AppDataSource.getRepository(Post);
          const post = postRepo.create({
            userId: req.userId!,
            originalPhotoPath: originalPath,
            previewPhotoPath: previewPath,
            description,
          });
          await postRepo.save(post);
          await fs.unlink(file.path).catch(() => {});
          resolve(res.status(201).json(post));
        } catch (error) {
          console.error("[post-service] createPost error:", error);
          resolve(res.status(500).json({ message: "Internal error" }));
        }
      });
    });
  }

  static async getFeed(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId!;
      // Пока Social Service недоступен, отдаём все посты.
      // В будущем здесь будет запрос к Social Service за списком подписок.
      const postRepo = AppDataSource.getRepository(Post);
      const posts = await postRepo.find({ order: { createdAt: "DESC" } });

      // Подгружаем данные авторов через Auth Service
      const userIds = Array.from(new Set(posts.map((p) => p.userId)));
      const users = await getUsersBatch(userIds);
      const userMap = new Map(users.map((u) => [u.id, u]));

      const result = posts.map((p) => ({
        ...p,
        user: userMap.get(p.userId) || null,
      }));

      return res.json(result);
    } catch (error) {
      console.error("[post-service] getFeed error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async getPostById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const postId = parseIdParam(req.params.id);
      if (postId === null) return res.status(400).json({ message: "Invalid post id" });

      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.findOne({ where: { id: postId } });
      if (!post) return res.status(404).json({ message: "Post not found" });

      const user = await getUserById(post.userId);

      return res.json({ ...post, user });
    } catch (error) {
      console.error("[post-service] getPostById error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async deletePost(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId!;
      const postId = parseIdParam(req.params.id);
      if (postId === null) return res.status(400).json({ message: "Invalid post id" });

      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.findOne({ where: { id: postId } });
      if (!post) return res.status(404).json({ message: "Post not found" });
      if (post.userId !== userId) return res.status(403).json({ message: "Not your post" });

      const originalFull = path.join(process.cwd(), "..", "..", post.originalPhotoPath);
      const previewFull = path.join(process.cwd(), "..", "..", post.previewPhotoPath);
      await fs.unlink(originalFull).catch(() => {});
      await fs.unlink(previewFull).catch(() => {});

      await postRepo.remove(post);

      // Публикуем событие для Comment Service и Social Service
      await publishEvent("post.deleted", { postId, userId });

      return res.json({ message: "Post deleted" });
    } catch (error) {
      console.error("[post-service] deletePost error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async likePost(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId!;
      const postId = parseIdParam(req.params.id);
      if (postId === null) return res.status(400).json({ message: "Invalid post id" });

      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.findOne({ where: { id: postId } });
      if (!post) return res.status(404).json({ message: "Post not found" });

      const likeRepo = AppDataSource.getRepository(Like);
      const existing = await likeRepo.findOne({ where: { userId, postId } });
      if (existing) return res.status(409).json({ message: "Already liked" });

      const like = likeRepo.create({ userId, postId });
      await likeRepo.save(like);

      // Публикуем событие, если лайкает не автор
      if (post.userId !== userId) {
        await publishEvent("like.created", {
          userId,
          postId,
          postOwnerId: post.userId,
        });
      }

      return res.status(201).json({ message: "Liked" });
    } catch (error) {
      console.error("[post-service] likePost error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async unlikePost(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId!;
      const postId = parseIdParam(req.params.id);
      if (postId === null) return res.status(400).json({ message: "Invalid post id" });

      const likeRepo = AppDataSource.getRepository(Like);
      await likeRepo.delete({ userId, postId });

      await publishEvent("like.removed", { userId, postId });

      return res.json({ message: "Unliked" });
    } catch (error) {
      console.error("[post-service] unlikePost error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async favoritePost(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId!;
      const postId = parseIdParam(req.params.id);
      if (postId === null) return res.status(400).json({ message: "Invalid post id" });

      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.findOne({ where: { id: postId } });
      if (!post) return res.status(404).json({ message: "Post not found" });

      const favRepo = AppDataSource.getRepository(Favorite);
      const existing = await favRepo.findOne({ where: { userId, postId } });
      if (existing) return res.status(409).json({ message: "Already in favorites" });

      const fav = favRepo.create({ userId, postId });
      await favRepo.save(fav);
      return res.status(201).json({ message: "Added to favorites" });
    } catch (error) {
      console.error("[post-service] favoritePost error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async unfavoritePost(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId!;
      const postId = parseIdParam(req.params.id);
      if (postId === null) return res.status(400).json({ message: "Invalid post id" });

      const favRepo = AppDataSource.getRepository(Favorite);
      await favRepo.delete({ userId, postId });
      return res.json({ message: "Removed from favorites" });
    } catch (error) {
      console.error("[post-service] unfavoritePost error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }
}