import axios from "axios";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || "internal_service_token_change_me";

export async function userExists(userId: number): Promise<boolean> {
  try {
    const res = await axios.get(`${AUTH_SERVICE_URL}/internal/users/${userId}/exists`, {
      headers: { "X-Service-Token": SERVICE_TOKEN },
      timeout: 5000,
    });
    return res.data.exists === true;
  } catch (error) {
    console.error("[social-service] userExists error:", error);
    return false;
  }
}