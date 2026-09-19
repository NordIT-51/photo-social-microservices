import amqp from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE = "comment.events";

let channel: amqp.Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    console.log("[comment-service] RabbitMQ connected.");
  } catch (error) {
    console.error("[comment-service] RabbitMQ connection error:", error);
    setTimeout(connectRabbitMQ, 5000);
  }
}

export async function publishEvent(routingKey: string, payload: object): Promise<void> {
  if (!channel) {
    console.warn("[comment-service] RabbitMQ channel not ready, skipping event:", routingKey);
    return;
  }
  try {
    const message = Buffer.from(JSON.stringify(payload));
    channel.publish(EXCHANGE, routingKey, message, { persistent: true });
    console.log(`[comment-service] Event published: ${routingKey}`, payload);
  } catch (error) {
    console.error("[comment-service] publishEvent error:", error);
  }
}