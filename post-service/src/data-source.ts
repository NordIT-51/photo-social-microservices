import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { Post } from "./entity/Post";
import { Like } from "./entity/Like";
import { Favorite } from "./entity/Favorite";

const dbPath = process.env.DB_PATH || path.join(__dirname, "../post.sqlite");

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [Post, Like, Favorite],
  migrations: [],
  subscribers: [],
});