import { Response } from "express";
import path from "path";
import multer from "multer";
import fs from "fs/promises";
import { AppDataSource } from "../data-source";
import { Comment } from "../entity/Comment";
import { AuthRequest } from "../middleware/auth";
import { ensureUploadDirs, processCommentPhoto } from "../utils/imageProcessor";
import { getUserById, getUsersBatch } from "../utils/authClient";
import { postExists } from "../utils/postClient";
import { publishEvent } from "../utils/rabbitmq";

const upload = multer({ dest: path.join(process.cwd(), "temp-uploads") });

function parseIdParam(param: string | string[]): number | null {
  const str = Array.isArray(param) ? param[0] : param;
  const id = parseInt(str, 10);
  return isNaN(id) ? null : id;
}

export class CommentController {
  static async addComment(req: AuthRequest, res: Response): Promise<Response> {
    return new Promise((resolve) => {
      const multerUpload = upload.single("photo");
      multerUpload(req as any, res as any, async (err: any) => {
        if (err) {
          resolve(res.status(400).json({ message: err.message }));
          return;
        }
        const { text } = req.body;
        if (!text) {
          resolve(res.status(400).json({ message: "Text is required" }));
          return;
        }
        const userId = req.userId!;
        const postId = parseIdParam(req.params.postId);
        if (postId === null) {
          resolve(res.status(400).json({ message: "Invalid post id" }));
          return;
        }

        // Проверяем существование поста через Post Service
        const exists = await postExists(postId);
        if (!exists) {
          resolve(res.status(404).json({ message: "Post not found" }));
          return;
        }

        const file = (req as any).file;
        let photoPath: string | null = null;
        if (file) {
          try {
            await ensureUploadDirs();
            const ext = path.extname(file.originalname);
            const fileName = `comment_${userId}_${Date.now()}${ext}.jpg`;
            photoPath = await processCommentPhoto(file.path, fileName);
            await fs.unlink(file.path).catch(() => {});
          } catch (error) {
            console.error("[comment-service] processCommentPhoto error:", error);
            resolve(res.status(500).json({ message: "Error processing photo" }));
            return;
          }
        }

        const commentRepo = AppDataSource.getRepository(Comment);
        const comment = commentRepo.create({ userId, postId, text, photoPath });
        await commentRepo.save(comment);

        // Получаем автора поста, чтобы отправить уведомление
        const postAuthor = await fetchPostAuthor(postId);
        if (postAuthor && postAuthor !== userId) {
          await publishEvent("comment.created", {
            commentId: comment.id,
            userId,
            postId,
            postOwnerId: postAuthor,
            hasPhoto: !!photoPath,
          });
        }

        resolve(res.status(201).json(comment));
      });
    });
  }

  static async deleteComment(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId!;
      const commentId = parseIdParam(req.params.id);
      if (commentId === null) return res.status(400).json({ message: "Invalid comment id" });

      const commentRepo = AppDataSource.getRepository(Comment);
      const comment = await commentRepo.findOne({ where: { id: commentId } });
      if (!comment) return res.status(404).json({ message: "Comment not found" });
      if (comment.userId !== userId) return res.status(403).json({ message: "Not your comment" });

      if (comment.photoPath) {
        const fullPath = path.join(process.cwd(), "..", "..", comment.photoPath);
        await fs.unlink(fullPath).catch(() => {});
      }
      await commentRepo.remove(comment);
      return res.json({ message: "Comment deleted" });
    } catch (error) {
      console.error("[comment-service] deleteComment error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async getCommentsByPost(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const postId = parseIdParam(req.params.postId);
      if (postId === null) return res.status(400).json({ message: "Invalid post id" });

      const commentRepo = AppDataSource.getRepository(Comment);
      const comments = await commentRepo.find({
        where: { postId },
        order: { createdAt: "ASC" },
      });

      const userIds = Array.from(new Set(comments.map((c) => c.userId)));
      const users = await getUsersBatch(userIds);
      const userMap = new Map(users.map((u) => [u.id, u]));

      const result = comments.map((c) => ({
        ...c,
        user: userMap.get(c.userId) || null,
      }));

      return res.json(result);
    } catch (error) {
      console.error("[comment-service] getCommentsByPost error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }
}

// Внутренняя функция для получения автора поста
import axios from "axios";
const POST_SERVICE_URL = process.env.POST_SERVICE_URL || "http://localhost:3002";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || "internal_service_token_change_me";

async function fetchPostAuthor(postId: number): Promise<number | null> {
  try {
    const res = await axios.get(`${POST_SERVICE_URL}/internal/posts/${postId}`, {
      headers: { "X-Service-Token": SERVICE_TOKEN },
      timeout: 5000,
    });
    return res.data.userId ?? null;
  } catch (error) {
    console.error("[comment-service] fetchPostAuthor error:", error);
    return null;
  }
}