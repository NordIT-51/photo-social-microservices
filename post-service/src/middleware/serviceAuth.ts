import { Request, Response, NextFunction } from "express";

export const SERVICE_TOKEN = process.env.SERVICE_TOKEN || "internal_service_token_change_me";

export const serviceAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["x-service-token"];
  if (!token || token !== SERVICE_TOKEN) {
    return res.status(401).json({ message: "Invalid service token" });
  }
  next();
};