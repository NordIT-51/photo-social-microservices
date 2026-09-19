import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Unique } from "typeorm";
import { Post } from "./Post";

@Entity("favorites")
@Unique(["userId", "postId"])
export class Favorite {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  postId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Post, (post) => post.favorites, { onDelete: "CASCADE" })
  post!: Post;
}