import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export interface CommentWithReplies {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  content: string;
  isAdminReply: boolean;
  createdAt: Date | string;
  replies: CommentWithReplies[];
}

export async function isCurrentSessionAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      return await verifySessionToken(token);
    }
  } catch {
    // cookies() unavailable or errored
  }
  return false;
}

export async function getPostComments(slug: string): Promise<CommentWithReplies[]> {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!post) {
    return [];
  }

  // Fetch all comments for this post
  const comments = await prisma.comment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      postId: true,
      parentId: true,
      authorName: true,
      content: true,
      isAdminReply: true,
      createdAt: true,
    },
  });

  // Organize into tree (top-level comments with replies)
  const commentMap = new Map<string, CommentWithReplies>();
  const rootComments: CommentWithReplies[] = [];

  for (const c of comments) {
    commentMap.set(c.id, {
      ...c,
      replies: [],
    });
  }

  for (const c of comments) {
    const current = commentMap.get(c.id)!;
    if (c.parentId && commentMap.has(c.parentId)) {
      commentMap.get(c.parentId)!.replies.push(current);
    } else {
      rootComments.push(current);
    }
  }

  // Return root comments newest first, while replies stay in chronological order
  return rootComments.reverse();
}

export async function createComment({
  slug,
  authorName,
  authorEmail,
  content,
  parentId,
}: {
  slug: string;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  parentId?: string | null;
}) {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  const isAdmin = await isCurrentSessionAdmin();

  // If admin is commenting/replying, display author as Prof. Surajit Borkotokey
  const finalAuthorName = isAdmin
    ? "Prof. Surajit Borkotokey"
    : authorName.trim();
  const isAdminReply = isAdmin;

  // Validate parent if provided
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, postId: true },
    });
    if (!parentComment || parentComment.postId !== post.id) {
      throw new Error("Invalid parent comment");
    }
  }

  const newComment = await prisma.comment.create({
    data: {
      postId: post.id,
      parentId: parentId || null,
      authorName: finalAuthorName,
      authorEmail: authorEmail?.trim() || null,
      content: content.trim(),
      isAdminReply,
    },
    select: {
      id: true,
      postId: true,
      parentId: true,
      authorName: true,
      content: true,
      isAdminReply: true,
      createdAt: true,
    },
  });

  return {
    ...newComment,
    replies: [],
  };
}

export async function deleteComment(commentId: string) {
  const isAdmin = await isCurrentSessionAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Only admin can delete comments");
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return { success: true };
}

export async function getAllCommentsForAdmin() {
  return await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
          language: true,
        },
      },
    },
    take: 100,
  });
}
