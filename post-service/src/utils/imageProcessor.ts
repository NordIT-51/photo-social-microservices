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

export async function processPostPhoto(
  filePath: string,
  baseName: string
): Promise<{ originalPath: string; previewPath: string }> {
  const originalName = `original_${baseName}.jpg`;
  const previewName = `preview_${baseName}.jpg`;
  const originalOutput = path.join(UPLOADS_DIR, "posts", originalName);
  const previewOutput = path.join(UPLOADS_DIR, "posts", previewName);

  await sharp(filePath).jpeg({ quality: 95 }).toFile(originalOutput);
  await sharp(filePath)
    .resize(1200, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(previewOutput);

  return {
    originalPath: `/uploads/posts/${originalName}`,
    previewPath: `/uploads/posts/${previewName}`,
  };
}