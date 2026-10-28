import { NextRequest, NextResponse } from "next/server";
import { getClientHash, getPostLikes, togglePostLike } from "@/lib/likes";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const userHash = await getClientHash();
    const result = await getPostLikes(slug, userHash);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching post likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch likes" },
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
    const userHash = await getClientHash();
    const result = await togglePostLike(slug, userHash);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling post like:", error);
    return NextResponse.json(
      { error: "Failed to update like status" },
      { status: 500 }
    );
  }
}
