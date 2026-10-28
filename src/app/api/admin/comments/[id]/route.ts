import { NextRequest, NextResponse } from "next/server";
import { assertAdminAuthorized } from "@/lib/auth";
import { deleteComment } from "@/lib/comments";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdminAuthorized();
    const { id } = await params;

    await deleteComment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment by admin:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 401 });
  }
}
