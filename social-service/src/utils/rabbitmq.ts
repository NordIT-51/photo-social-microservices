import amqp from "amqplib";
import { AppDataSource } from "../data-source";
import { Notification } from "../entity/Notification";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

// Тип для connection — любой, чтобы обойти несовместимость типов @types/amqplib
// (amqp.connect возвращает ChannelModel в новых версиях)
let connection: any = null;
let channel: amqp.Channel | null = null;

// Обработчик события like.created
async function handleLikeCreated(payload: {
  userId: number;
  postId: number;
  postOwnerId: number;
}) {
  try {
    if (payload.userId === payload.postOwnerId) return;
    const notifRepo = AppDataSource.getRepository(Notification);
    const notif = notifRepo.create({
      userId: payload.postOwnerId,
      type: "like",
      relatedUserId: payload.userId,
      relatedPostId: payload.postId,
    });
    await notifRepo.save(notif);
    console.log("[social-service] Notification created for like:", notif.id);
  } catch (error) {
    console.error("[social-service] handleLikeCreated error:", error);
  }
}

// Обработчик события like.removed
async function handleLikeRemoved(payload: { userId: number; postId: number }) {
  try {
    const notifRepo = AppDataSource.getRepository(Notification);
    await notifRepo.delete({
      type: "like",
      relatedUserId: payload.userId,
      relatedPostId: payload.postId,
    });
    console.log("[social-service] Notification removed for like");
  } catch (error) {
    console.error("[social-service] handleLikeRemoved error:", error);
  }
}

// Обработчик события comment.created
async function handleCommentCreated(payload: {
  commentId: number;
  userId: number;
  postId: number;
  postOwnerId: number;
  hasPhoto: boolean;
}) {
  try {
    if (payload.userId === payload.postOwnerId) return;
    const notifRepo = AppDataSource.getRepository(Notification);
    const notif = notifRepo.create({
      userId: payload.postOwnerId,
      type: "comment",
      relatedUserId: payload.userId,
      relatedPostId: payload.postId,
    });
    await notifRepo.save(notif);
    console.log("[social-service] Notification created for comment:", notif.id);
  } catch (error) {
    console.error("[social-service] handleCommentCreated error:", error);
  }
}

// Обработчик события post.deleted (удаляем уведомления по этому посту)
async function handlePostDeleted(payload: { postId: number; userId: number }) {
  try {
    const notifRepo = AppDataSource.getRepository(Notification);
    await notifRepo.delete({ relatedPostId: payload.postId });
    console.log("[social-service] Notifications removed for post:", payload.postId);
  } catch (error) {
    console.error("[social-service] handlePostDeleted error:", error);
  }
}

export async function connectRabbitMQ(): Promise<void> {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    const ch: amqp.Channel = await connection.createChannel();
    channel = ch;

    // Объявляем обменники (те же, что и в Post/Comment Service)
    await ch.assertExchange("post.events", "topic", { durable: true });
    await ch.assertExchange("comment.events", "topic", { durable: true });

    // Создаём очередь для Social Service
    const queueName = "social-service-events";
    await ch.assertQueue(queueName, { durable: true });

    // Привязываем очередь к событиям
    await ch.bindQueue(queueName, "post.events", "like.created");
    await ch.bindQueue(queueName, "post.events", "like.removed");
    await ch.bindQueue(queueName, "post.events", "post.deleted");
    await ch.bindQueue(queueName, "comment.events", "comment.created");

    // Подписываемся на сообщения
    await ch.consume(queueName, async (msg) => {
      if (!msg) return;
      const routingKey = msg.fields.routingKey;
      try {
        const payload = JSON.parse(msg.content.toString());
        console.log(`[social-service] Received event: ${routingKey}`, payload);

        switch (routingKey) {
          case "like.created":
            await handleLikeCreated(payload);
            break;
          case "like.removed":
            await handleLikeRemoved(payload);
            break;
          case "comment.created":
            await handleCommentCreated(payload);
            break;
          case "post.deleted":
            await handlePostDeleted(payload);
            break;
          default:
            console.warn(`[social-service] Unknown routing key: ${routingKey}`);
        }

        ch.ack(msg);
      } catch (error) {
        console.error(`[social-service] Error processing ${routingKey}:`, error);
        ch.nack(msg, false, false);
      }
    });

    console.log("[social-service] RabbitMQ connected and consuming events.");
  } catch (error) {
    console.error("[social-service] RabbitMQ connection error:", error);
    setTimeout(connectRabbitMQ, 5000);
  }
}

export function getChannel(): amqp.Channel | null {
  return channel;
}