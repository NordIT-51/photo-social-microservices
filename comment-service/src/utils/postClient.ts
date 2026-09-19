import axios from "axios";

const POST_SERVICE_URL = process.env.POST_SERVICE_URL || "http://localhost:3002";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || "internal_service_token_change_me";

const client = axios.create({
  baseURL: POST_SERVICE_URL,
  timeout: 5000,
  headers: { "X-Service-Token": SERVICE_TOKEN },
});

export async function postExists(postId: number): Promise<boolean> {
  try {
    const res = await client.get(`/internal/posts/${postId}/exists`);
    return res.data.exists === true;
  } catch (error) {
    console.error("[comment-service] postExists error:", error);
    return false;
  }
}