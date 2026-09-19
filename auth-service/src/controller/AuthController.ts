import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { JWT_SECRET } from "../middleware/auth";

export class AuthController {
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email and password required" });
      }
      const userRepository = AppDataSource.getRepository(User);
      const existing = await userRepository.findOne({ where: [{ username }, { email }] });
      if (existing) {
        return res.status(409).json({ message: "Username or email already exists" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = userRepository.create({ username, email, passwordHash });
      await userRepository.save(user);
      return res.status(201).json({ id: user.id, username: user.username, email: user.email });
    } catch (error) {
      console.error("[auth-service] register error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({
        token,
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (error) {
      console.error("[auth-service] login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}