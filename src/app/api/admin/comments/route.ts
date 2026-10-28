import { NextRequest, NextResponse } from "next/server";
import { assertAdminAuthorized } from "@/lib/auth";
import { getAllCommentsForAdmin, createComment } from "@/lib/comments";

export async function GET() {
  try {
    await assertAdminAuthorized();
    const comments = await getAllCommentsForAdmin();
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminAuthorized();
    const body = await request.json();
    const { slug, parentId, content } = body;

    if (!slug || !content || !parentId) {
      return NextResponse.json(
        { error: "slug, parentId, and content are required" },
        { status: 400 }
      );
    }

    const reply = await createComment({
      slug,
      authorName: "Prof. Surajit Borkotokey",
      content,
      parentId,
    });

    return NextResponse.json({ reply, success: true });
  } catch (error) {
    console.error("Error creating admin reply:", error);
    return NextResponse.json({ error: "Unauthorized or failed" }, { status: 401 });
  }
}
