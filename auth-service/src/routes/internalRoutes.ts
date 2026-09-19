import { Router } from "express";
import jwt from "jsonwebtoken";
import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { serviceAuth } from "../middleware/serviceAuth";
import { JWT_SECRET } from "../middleware/auth";

const router = Router();

router.use(serviceAuth);

router.get("/users/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    const id = typeof idParam === "string" ? parseInt(idParam, 10) : parseInt(idParam[0], 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ id: user.id, username: user.username, avatarPath: user.avatarPath });
  } catch (error) {
    console.error("[auth-service] internal users/:id error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.post("/users/batch", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: "ids must be an array" });
    }
    const numericIds = ids.map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
    if (numericIds.length === 0) return res.json([]);
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find({ where: { id: In(numericIds) } });
    return res.json(
      users.map((u) => ({ id: u.id, username: u.username, avatarPath: u.avatarPath }))
    );
  } catch (error) {
    console.error("[auth-service] internal users/batch error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.get("/users/:id/exists", async (req, res) => {
  try {
    const idParam = req.params.id;
    const id = typeof idParam === "string" ? parseInt(idParam, 10) : parseInt(idParam[0], 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const userRepo = AppDataSource.getRepository(User);
    const count = await userRepo.count({ where: { id } });
    return res.json({ exists: count > 0 });
  } catch (error) {
    console.error("[auth-service] internal users/:id/exists error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.post("/auth/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false, message: "No token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return res.json({ valid: true, userId: decoded.userId });
  } catch (error) {
    return res.status(401).json({ valid: false, message: "Invalid token" });
  }
});

export default router;