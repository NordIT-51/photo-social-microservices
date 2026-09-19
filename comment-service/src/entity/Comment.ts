import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  postId!: number;

  @Column({ type: "text" })
  text!: string;

  @Column({ type: "varchar", nullable: true })
  photoPath!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}