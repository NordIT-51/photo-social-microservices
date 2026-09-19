import { Response } from "express";
import path from "path";
import multer from "multer";
import fs from "fs/promises";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { AuthRequest } from "../middleware/auth";
import { ensureUploadDirs, processAvatar } from "../utils/imageProcessor";

const upload = multer({ dest: path.join(process.cwd(), "temp-uploads") });

export class UserController {
  static async getProfile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId!;
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        select: ["id", "username", "email", "avatarPath", "createdAt"],
      });
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch (error) {
      console.error("[auth-service] getProfile error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  }

  static async updateAvatar(req: AuthRequest, res: Response): Promise<Response> {
    return new Promise((resolve) => {
      const multerUpload = upload.single("avatar");
      multerUpload(req as any, res as any, async (err: any) => {
        if (err) {
          resolve(res.status(400).json({ message: err.message }));
          return;
        }
        const file = (req as any).file;
        if (!file) {
          resolve(res.status(400).json({ message: "No file uploaded" }));
          return;
        }
        try {
          await ensureUploadDirs();
          const ext = path.extname(file.originalname);
          const outputName = `${req.userId}_${Date.now()}${ext}.jpg`;
          const avatarUrl = await processAvatar(file.path, outputName);
          const userRepository = AppDataSource.getRepository(User);
          await userRepository.update(req.userId!, { avatarPath: avatarUrl });
          await fs.unlink(file.path).catch(() => {});
          resolve(res.json({ avatarPath: avatarUrl }));
        } catch (error) {
          console.error("[auth-service] updateAvatar error:", error);
          resolve(res.status(500).json({ message: "Internal error" }));
        }
      });
    });
  }
}