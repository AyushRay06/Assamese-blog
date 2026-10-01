import prisma from "./prisma";
import { Language, PostStatus, Prisma } from "@prisma/client";

export interface GetPublishedPostsOptions {
  language?: "EN" | "AS";
  page?: number;
  limit?: number;
}

export async function getPublishedPosts({
  language,
  page = 1,
  limit = 9,
}: GetPublishedPostsOptions = {}) {
  const skip = (page - 1) * limit;

  const where: Prisma.PostWhereInput = {
    status: PostStatus.PUBLISHED,
    ...(language ? { language: language as Language } : {}),
  };

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: {
        publishedAt: "desc",
      },
      skip,
      take: limit,
      include: {
        tags: true,
      },
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    posts,
    totalCount,
    totalPages,
    currentPage: page,
    hasMore: page < totalPages,
  };
}

export async function getPublishedPostBySlug(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      tags: true,
    },
  });

  // Strict: public route must never expose drafts
  if (!post || post.status !== PostStatus.PUBLISHED) {
    return null;
  }

  return post;
}

export async function getAllPostsAdmin(options?: {
  search?: string;
  status?: "DRAFT" | "PUBLISHED";
  language?: "EN" | "AS";
}) {
  const where: Prisma.PostWhereInput = {
    ...(options?.status ? { status: options.status as PostStatus } : {}),
    ...(options?.language ? { language: options.language as Language } : {}),
    ...(options?.search
      ? {
          OR: [
            { title: { contains: options.search, mode: "insensitive" } },
            { excerpt: { contains: options.search, mode: "insensitive" } },
            { slug: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.post.findMany({
    where,
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      tags: true,
    },
  });
}

export async function getPostByIdAdmin(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      tags: true,
    },
  });
}
