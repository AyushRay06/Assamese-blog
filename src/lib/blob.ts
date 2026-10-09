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
 * Helper to discover Vercel Blob read/write token from process.env.
 * Supports standard BLOB_READ_WRITE_TOKEN, VERCEL_BLOB_READ_WRITE_TOKEN,
 * or any store-prefixed token like <STORE_NAME>_READ_WRITE_TOKEN.
 */
function findBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return process.env.BLOB_READ_WRITE_TOKEN;
  }
  if (process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    return process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
  }
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith("_READ_WRITE_TOKEN") && value) {
      return value;
    }
  }
  return undefined;
}

/**
 * Storage adapter abstraction.
 * 1. Uses Vercel Blob if a Blob token is available in environment variables.
 * 2. In local development, saves to public/uploads/posts.
 * 3. In serverless or read-only filesystem environments (e.g. Vercel /var/task),
 *    safely falls back to a base64 Data URL so uploads never fail with ENOENT /var/task/public.
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

  const blobToken = findBlobToken();

  // If Vercel Blob token is configured, upload to Vercel Blob
  if (blobToken) {
    try {
      const blob = await put(uniqueName, fileOrBuffer, {
        access: "public",
        contentType,
        addRandomSuffix: false,
        token: blobToken,
      });
      return {
        url: blob.url,
        pathname: blob.pathname,
      };
    } catch (blobErr) {
      console.warn("Vercel Blob upload failed, falling back to local or base64 storage:", blobErr);
    }
  }

  const buffer =
    fileOrBuffer instanceof Buffer
      ? fileOrBuffer
      : Buffer.from(await (fileOrBuffer as Blob).arrayBuffer());

  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error("File exceeds maximum allowed size of 5 MB");
  }

  // Local development fallback: store in public/uploads/posts
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "posts");
    await fs.mkdir(uploadDir, { recursive: true });

    const localFilePath = path.join(uploadDir, path.basename(uniqueName));
    await fs.writeFile(localFilePath, buffer);

    return {
      url: `/uploads/posts/${path.basename(uniqueName)}`,
      pathname: uniqueName,
    };
  } catch (fsErr) {
    // Serverless fallback: On environments like Vercel Lambda where /var/task is read-only,
    // convert image to a base64 Data URL so the blog upload never throws ENOENT.
    console.warn(
      "Local filesystem is read-only (/var/task). Using base64 Data URL fallback for post image:",
      fsErr
    );
    const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
    return {
      url: dataUrl,
      pathname: uniqueName,
    };
  }
}
