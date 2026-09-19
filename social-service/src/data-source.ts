import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { Follow } from "./entity/Follow";
import { Notification } from "./entity/Notification";

const dbPath = process.env.DB_PATH || path.join(__dirname, "../social.sqlite");

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [Follow, Notification],
  migrations: [],
  subscribers: [],
});