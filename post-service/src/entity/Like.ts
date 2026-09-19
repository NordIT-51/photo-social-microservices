import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Unique } from "typeorm";
import { Post } from "./Post";

@Entity("likes")
@Unique(["userId", "postId"])
export class Like {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  postId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: "CASCADE" })
  post!: Post;
}