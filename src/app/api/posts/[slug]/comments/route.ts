import { NextRequest, NextResponse } from "next/server";
import {
  getPostComments,
  createComment,
  deleteComment,
  isCurrentSessionAdmin,
} from "@/lib/comments";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const [comments, isAdmin] = await Promise.all([
      getPostComments(slug),
      isCurrentSessionAdmin(),
    ]);

    return NextResponse.json({
      comments,
      isAdmin,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to load comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { authorName, authorEmail, content, parentId } = body;

    const isAdmin = await isCurrentSessionAdmin();

    if (!content || typeof content !== "string" || content.trim().length < 2) {
      return NextResponse.json(
        { error: "Comment message must be at least 2 characters long." },
        { status: 400 }
      );
    }

    if (!isAdmin && (!authorName || typeof authorName !== "string" || authorName.trim().length < 1)) {
      return NextResponse.json(
        { error: "Please provide your name." },
        { status: 400 }
      );
    }

    const comment = await createComment({
      slug,
      authorName: authorName || "Anonymous Reader",
      authorEmail: authorEmail || null,
      content,
      parentId: parentId || null,
    });

    return NextResponse.json({
      comment,
      success: true,
    });
  } catch (error) {
    console.error("Error submitting comment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const body = await request.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID required" },
        { status: 400 }
      );
    }

    await deleteComment(commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 403 }
    );
  }
}
