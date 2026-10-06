import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/reviews");
export const MAX_REVIEW_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_REVIEW_IMAGES = 2;

export async function saveReviewImages(files: File[]): Promise<string[] | { error: string }> {
  const imageFiles = files.filter((file) => file instanceof File && file.size > 0);

  if (imageFiles.length > MAX_REVIEW_IMAGES) {
    return { error: `You can upload at most ${MAX_REVIEW_IMAGES} images` };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const urls: string[] = [];

  for (const file of imageFiles) {
    if (!file.type.startsWith("image/")) {
      return { error: "Images must be image files" };
    }
    if (file.size > MAX_REVIEW_IMAGE_BYTES) {
      return { error: "Each image must be 2MB or smaller" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    urls.push(`/uploads/reviews/${filename}`);
  }

  return urls;
}
