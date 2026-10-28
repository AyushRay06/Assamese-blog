import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Generate a privacy-preserving user hash based on IP address and User-Agent.
 */
export async function getClientHash(): Promise<string> {
  const reqHeaders = await headers();
  const forwarded = reqHeaders.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  const raw = `${ip}::${userAgent}::academic_blog_like_salt`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function getPostLikes(slug: string, userHash?: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true, likes: true },
  });

  if (!post) {
    return { likes: 0, hasLiked: false, postId: null };
  }

  let hasLiked = false;
  if (userHash) {
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userHash: {
          postId: post.id,
          userHash,
        },
      },
    });
    hasLiked = Boolean(existingLike);
  }

  return { likes: post.likes, hasLiked, postId: post.id };
}

export async function togglePostLike(slug: string, userHash: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true, likes: true },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  const existingLike = await prisma.postLike.findUnique({
    where: {
      postId_userHash: {
        postId: post.id,
        userHash,
      },
    },
  });

  if (existingLike) {
    // User already liked -> unlike
    await prisma.$transaction([
      prisma.postLike.delete({
        where: { id: existingLike.id },
      }),
      prisma.post.update({
        where: { id: post.id },
        data: {
          likes: {
            decrement: post.likes > 0 ? 1 : 0,
          },
        },
      }),
    ]);

    const updated = await prisma.post.findUnique({
      where: { id: post.id },
      select: { likes: true },
    });

    return { likes: Math.max(0, updated?.likes ?? 0), hasLiked: false };
  } else {
    // User likes the post
    await prisma.$transaction([
      prisma.postLike.create({
        data: {
          postId: post.id,
          userHash,
        },
      }),
      prisma.post.update({
        where: { id: post.id },
        data: {
          likes: {
            increment: 1,
          },
        },
      }),
    ]);

    const updated = await prisma.post.findUnique({
      where: { id: post.id },
      select: { likes: true },
    });

    return { likes: updated?.likes ?? 1, hasLiked: true };
  }
}
