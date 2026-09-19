import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Like } from "./Like";
import { Favorite } from "./Favorite";

@Entity("posts")
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  originalPhotoPath!: string;

  @Column()
  previewPhotoPath!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Like, (like) => like.post)
  likes!: Like[];

  @OneToMany(() => Favorite, (favorite) => favorite.post)
  favorites!: Favorite[];
}