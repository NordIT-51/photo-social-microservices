import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import socialRoutes from "./routes/socialRoutes";
import internalRoutes from "./routes/internalRoutes";
import { connectRabbitMQ } from "./utils/rabbitmq";

const app = express();
app.use(express.json());

app.use("/social", socialRoutes);
app.use("/internal", internalRoutes);

app.get("/", (req, res) => {
  res.json({ service: "social-service", status: "ok" });
});

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log("[social-service] Database connected.");

    await connectRabbitMQ();

    const PORT = 3004;
    app.listen(PORT, () => {
      console.log(`[social-service] Running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[social-service] bootstrap error:", error);
  }
}

bootstrap();