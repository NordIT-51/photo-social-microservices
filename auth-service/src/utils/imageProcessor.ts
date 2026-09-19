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

export async function processAvatar(filePath: string, outputFileName: string): Promise<string> {
  const outputPath = path.join(UPLOADS_DIR, "avatars", outputFileName);
  await sharp(filePath)
    .resize(200, 200, { fit: "cover" })
    .jpeg({ quality: 85 })
    .toFile(outputPath);
  return `/uploads/avatars/${outputFileName}`;
}