import { NextRequest, NextResponse } from "next/server";
import { verifyBasicAuthHeader, checkRateLimit } from "@/lib/auth";
import { uploadImage, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/blob";

export async function POST(request: NextRequest) {
  // Re-verify authorization on server
  const authHeader = request.headers.get("authorization");
  if (!verifyBasicAuthHeader(authHeader)) {
    return NextResponse.json(
      { error: "Unauthorized: Admin credentials required" },
      { status: 401 }
    );
  }

  // Rate limiting (max 20 uploads per minute per IP)
  const clientIp = request.headers.get("x-forwarded-for") || "admin-client";
  const rateLimit = checkRateLimit(`upload-${clientIp}`, 20, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many upload requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Supported formats: JPEG, PNG, WebP, GIF, AVIF`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 5 MB limit" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadImage(buffer, file.name, file.type);

    return NextResponse.json(uploadResult);
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload image" },
      { status: 500 }
    );
  }
}
