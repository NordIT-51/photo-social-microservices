import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import postRoutes from "./routes/postRoutes";
import internalRoutes from "./routes/internalRoutes";
import { UPLOADS_DIR, ensureUploadDirs } from "./utils/imageProcessor";
import { connectRabbitMQ } from "./utils/rabbitmq";

const app = express();
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/posts", postRoutes);
app.use("/internal", internalRoutes);

app.get("/", (req, res) => {
  res.json({ service: "post-service", status: "ok" });
});

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log("[post-service] Database connected.");
    await ensureUploadDirs();
    await connectRabbitMQ();

    const PORT = 3002;
    app.listen(PORT, () => {
      console.log(`[post-service] Running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[post-service] bootstrap error:", error);
  }
}

bootstrap();