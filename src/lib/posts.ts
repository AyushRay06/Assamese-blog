import prisma from "./prisma";
import { Language, PostStatus, Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

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
  if (!process.env.DATABASE_URL) {
    return {
      posts: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      hasMore: false,
    };
  }

  const skip = (page - 1) * limit;

  const where: Prisma.PostWhereInput = {
    status: PostStatus.PUBLISHED,
    ...(language ? { language: language as Language } : {}),
  };

  try {
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: {
          publishedAt: "desc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          language: true,
          status: true,
          publishedAt: true,
          readingTime: true,
          likes: true,
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
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
  } catch (error) {
    console.warn("getPublishedPosts database error:", error);
    return {
      posts: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      hasMore: false,
    };
  }
}

const cachedPublishedPostsQuery = unstable_cache(
  async (language?: "EN" | "AS", page: number = 1, limit: number = 12) => {
    return getPublishedPosts({ language, page, limit });
  },
  ["published-posts-cache"],
  { revalidate: 60, tags: ["posts"] }
);

export async function getCachedPublishedPosts(
  language?: "EN" | "AS",
  page: number = 1,
  limit: number = 12
) {
  try {
    return await cachedPublishedPostsQuery(language, page, limit);
  } catch {
    return getPublishedPosts({ language, page, limit });
  }
}

export async function getPostCounts() {
  if (!process.env.DATABASE_URL) {
    return { all: 0, en: 0, as: 0 };
  }
  try {
    const [all, en, as] = await Promise.all([
      prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      prisma.post.count({ where: { status: PostStatus.PUBLISHED, language: Language.EN } }),
      prisma.post.count({ where: { status: PostStatus.PUBLISHED, language: Language.AS } }),
    ]);
    return { all, en, as };
  } catch {
    return { all: 0, en: 0, as: 0 };
  }
}

export const getCachedPostCounts = unstable_cache(
  getPostCounts,
  ["published-counts-cache"],
  { revalidate: 60, tags: ["posts"] }
);

export async function getPublishedPostBySlug(slug: string) {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  try {
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
  } catch (error) {
    console.warn("getPublishedPostBySlug database error:", error);
    return null;
  }
}

export async function getRelatedPosts(currentPostId: string, limit: number = 2) {
  if (!process.env.DATABASE_URL) {
    return [];
  }
  try {
    return await prisma.post.findMany({
      where: {
        id: { not: currentPostId },
        status: PostStatus.PUBLISHED,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        language: true,
        status: true,
        publishedAt: true,
        readingTime: true,
        likes: true,
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.warn("getRelatedPosts database error:", error);
    return [];
  }
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
    select: {
      id: true,
      title: true,
      slug: true,
      language: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      readingTime: true,
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
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
