import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type NotificationType = "like" | "comment" | "follow";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column({ type: "varchar" })
  type!: NotificationType;

  @Column({ type: "integer", nullable: true })
  relatedUserId!: number | null;

  @Column({ type: "integer", nullable: true })
  relatedPostId!: number | null;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}