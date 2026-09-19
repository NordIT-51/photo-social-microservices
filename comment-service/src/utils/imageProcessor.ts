import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.resolve(__dirname, "../../../../uploads");

export async function ensureUploadDirs() {
  const dirs = ["avatars", "posts", "comment-photos", "temp"];
  for (const dir of dirs) {
    await fs.mkdir(path.join(UPLOADS_DIR, dir), { recursive: true });
  }
}

export async function processCommentPhoto(
  filePath: string,
  outputFileName: string
): Promise<string> {
  const outputPath = path.join(UPLOADS_DIR, "comment-photos", outputFileName);
  await sharp(filePath)
    .resize(2560, 2560, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 95 })
    .toFile(outputPath);
  return `/uploads/comment-photos/${outputFileName}`;
}