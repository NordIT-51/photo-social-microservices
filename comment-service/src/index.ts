import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import commentRoutes from "./routes/commentRoutes";
import internalRoutes from "./routes/internalRoutes";
import { UPLOADS_DIR, ensureUploadDirs } from "./utils/imageProcessor";
import { connectRabbitMQ } from "./utils/rabbitmq";

const app = express();
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/comments", commentRoutes);
app.use("/internal", internalRoutes);

app.get("/", (req, res) => {
  res.json({ service: "comment-service", status: "ok" });
});

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log("[comment-service] Database connected.");
    await ensureUploadDirs();
    await connectRabbitMQ();

    const PORT = 3003;
    app.listen(PORT, () => {
      console.log(`[comment-service] Running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[comment-service] bootstrap error:", error);
  }
}

bootstrap();