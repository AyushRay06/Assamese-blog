import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  url: string;
  pathname: string;
}

/**
 * Storage adapter abstraction.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is configured.
 * Falls back to local public uploads directory for local development.
 */
export async function uploadImage(
  fileOrBuffer: Buffer | Blob | File,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error(
      `Unsupported file type: ${contentType}. Allowed types: JPEG, PNG, WebP, GIF, AVIF.`
    );
  }

  // Generate unique filename
  const ext = path.extname(filename) || `.${contentType.split("/")[1] || "png"}`;
  const cleanBase = path
    .basename(filename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 30);
  const uniqueName = `posts/${cleanBase}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

  // If Vercel Blob token is configured, upload to Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(uniqueName, fileOrBuffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  }

  // Local development fallback: store in public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads", "posts");
  await fs.mkdir(uploadDir, { recursive: true });

  const localFilePath = path.join(uploadDir, path.basename(uniqueName));
  const buffer =
    fileOrBuffer instanceof Buffer
      ? fileOrBuffer
      : Buffer.from(await (fileOrBuffer as Blob).arrayBuffer());

  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error("File exceeds maximum allowed size of 5 MB");
  }

  await fs.writeFile(localFilePath, buffer);

  return {
    url: `/uploads/posts/${path.basename(uniqueName)}`,
    pathname: uniqueName,
  };
}
