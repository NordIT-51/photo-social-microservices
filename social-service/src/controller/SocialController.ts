import { Response } from "express";
import { AppDataSource } from "../data-source";
import { Follow } from "../entity/Follow";
import { Notification } from "../entity/Notification";
import { AuthRequest } from "../middleware/auth";
import { userExists } from "../utils/authClient";

function parseIdParam(param: string | string[]): number | null {
  const str = Array.isArray(param) ? param[0] : param;
  const id = parseInt(str, 10);
  return isNaN(id) ? null : id;
}

export class SocialController {
  static async follow(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const followerId = req.userId!;
      const followingId = parseIdParam(req.params.followingId);
      if (followingId === null) return res.status(400).json({ message: "Invalid user id" });
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      // Проверяем, что пользователь существует (через Auth Service)
      const exists = await userExists(followingId);
      if (!exists) return res.status(404).json({ message: "User not found" });

      const followRepo = AppDataSource.getRepository(Follow);
      const existing = await followRepo.findOne({ where: { followerId, followingId } });
      if (existing) return res.status(409).json({ message: "Already following" });

      const follow = followRepo.create({ followerId, followingId });
      await followRepo.save(follow);

      // Создаём уведомление о подписке
      const notifRepo = AppDataSource.getRepository(Notification);
      const notif = notifRepo.create({
        userId: followingId,
        type: "follow",
        relatedUserId: followerId,
      });
      await notifRepo.save(notif);

      return res.status(201).json({ message: "Followed" });
    } catch (error) {
      console.error("[social-service] follow error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async unfollow(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const followerId = req.userId!;
      const followingId = parseIdParam(req.params.followingId);
      if (followingId === null) return res.status(400).json({ message: "Invalid user id" });

      const followRepo = AppDataSource.getRepository(Follow);
      await followRepo.delete({ followerId, followingId });
      return res.json({ message: "Unfollowed" });
    } catch (error) {
      console.error("[social-service] unfollow error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async getNotifications(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId!;
      const notifRepo = AppDataSource.getRepository(Notification);
      const notifications = await notifRepo.find({
        where: { userId },
        order: { createdAt: "DESC" },
      });
      return res.json(notifications);
    } catch (error) {
      console.error("[social-service] getNotifications error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId!;
      const notificationId = parseIdParam(req.params.id);
      if (notificationId === null) return res.status(400).json({ message: "Invalid notification id" });

      const notifRepo = AppDataSource.getRepository(Notification);
      const notification = await notifRepo.findOne({ where: { id: notificationId, userId } });
      if (!notification) return res.status(404).json({ message: "Not found" });

      notification.isRead = true;
      await notifRepo.save(notification);
      return res.json({ message: "Marked as read" });
    } catch (error) {
      console.error("[social-service] markAsRead error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  // Внутренние эндпоинты для других сервисов
  static async internalGetFollowing(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = parseIdParam(req.params.userId);
      if (userId === null) return res.status(400).json({ message: "Invalid user id" });
      const followRepo = AppDataSource.getRepository(Follow);
      const follows = await followRepo.find({ where: { followerId: userId } });
      return res.json(follows.map((f) => ({ followingId: f.followingId })));
    } catch (error) {
      console.error("[social-service] internalGetFollowing error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async internalGetFollowers(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = parseIdParam(req.params.userId);
      if (userId === null) return res.status(400).json({ message: "Invalid user id" });
      const followRepo = AppDataSource.getRepository(Follow);
      const follows = await followRepo.find({ where: { followingId: userId } });
      return res.json(follows.map((f) => ({ followerId: f.followerId })));
    } catch (error) {
      console.error("[social-service] internalGetFollowers error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }
}