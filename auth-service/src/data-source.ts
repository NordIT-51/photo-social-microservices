import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { User } from "./entity/User";

const dbPath = process.env.DB_PATH || path.join(__dirname, "../auth.sqlite");

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [User],
  migrations: [],
  subscribers: [],
});