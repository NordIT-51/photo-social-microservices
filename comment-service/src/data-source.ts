import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { Comment } from "./entity/Comment";

const dbPath = process.env.DB_PATH || path.join(__dirname, "../comment.sqlite");

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [Comment],
  migrations: [],
  subscribers: [],
});