import axios from "axios";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || "internal_service_token_change_me";

const client = axios.create({
  baseURL: AUTH_SERVICE_URL,
  timeout: 5000,
  headers: { "X-Service-Token": SERVICE_TOKEN },
});

export interface UserInfo {
  id: number;
  username: string;
  avatarPath: string | null;
}

export async function getUserById(userId: number): Promise<UserInfo | null> {
  try {
    const res = await client.get(`/internal/users/${userId}`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error("[post-service] getUserById error:", error);
    return null;
  }
}

export async function getUsersBatch(ids: number[]): Promise<UserInfo[]> {
  if (ids.length === 0) return [];
  try {
    const res = await client.post("/internal/users/batch", { ids });
    return res.data;
  } catch (error) {
    console.error("[post-service] getUsersBatch error:", error);
    return [];
  }
}