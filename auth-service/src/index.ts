import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import internalRoutes from "./routes/internalRoutes";
import { UPLOADS_DIR, ensureUploadDirs } from "./utils/imageProcessor";

const app = express();
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/internal", internalRoutes);

app.get("/", (req, res) => {
  res.json({ service: "auth-service", status: "ok" });
});

AppDataSource.initialize()
  .then(async () => {
    console.log("[auth-service] Database connected.");
    await ensureUploadDirs();
    const PORT = 3001;
    app.listen(PORT, () => {
      console.log(`[auth-service] Running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("[auth-service] DB init error:", error);
  });