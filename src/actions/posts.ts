"use server";

import prisma from "@/lib/prisma";
import { postSchema, PostInput } from "@/lib/validations";
import { sanitizePostHtml } from "@/lib/sanitize";
import { calculateReadingTime, LanguageCode } from "@/lib/languages";
import { assertAdminAuthorized } from "@/lib/auth";
import { revalidatePath, updateTag } from "next/cache";
import { PostStatus, Language } from "@prisma/client";

function extractPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function createPostAction(
  data: PostInput
): Promise<
  | { success: true; id: string; slug: string }
  | { success: false; error: string }
> {
  try {
    await assertAdminAuthorized();
  } catch {
    return {
      success: false,
      error: "Your admin session expired or you need to log in again on this domain. Please log in at /admin/login.",
    };
  }

  const parseResult = postSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Invalid post data provided.",
    };
  }
  const validated = parseResult.data;

  try {
    // Check slug uniqueness
    const existing = await prisma.post.findUnique({
      where: { slug: validated.slug },
    });
    if (existing) {
      return {
        success: false,
        error: `A post with slug "${validated.slug}" already exists. Please choose a different title or slug.`,
      };
    }

    const sanitizedHtml = sanitizePostHtml(validated.contentHtml);
    const plainText = extractPlainText(sanitizedHtml);
    const readingTime = calculateReadingTime(plainText, validated.language as LanguageCode);

    const publishedAt =
      validated.status === "PUBLISHED"
        ? validated.publishedAt
          ? new Date(validated.publishedAt)
          : new Date()
        : null;

    const post = await prisma.post.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        excerpt: validated.excerpt || null,
        coverImage: validated.coverImage || null,
        content: validated.content as object,
        contentHtml: sanitizedHtml,
        language: validated.language as Language,
        status: validated.status as PostStatus,
        publishedAt,
        readingTime,
        tags: {
          connectOrCreate: validated.tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin");
    revalidatePath("/rss.xml");
    revalidatePath("/sitemap.xml");
    try {
      updateTag("posts");
    } catch {}

    return { success: true, id: post.id, slug: post.slug };
  } catch (err) {
    console.error("createPostAction database error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create post.",
    };
  }
}

export async function updatePostAction(
  id: string,
  data: PostInput
): Promise<
  | { success: true; id: string; slug: string }
  | { success: false; error: string }
> {
  try {
    await assertAdminAuthorized();
  } catch {
    return {
      success: false,
      error: "Your admin session expired or you need to log in again on this domain. Please log in at /admin/login.",
    };
  }

  const parseResult = postSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Invalid post data provided.",
    };
  }
  const validated = parseResult.data;

  try {
    // Check slug uniqueness if changed
    const existingSlugPost = await prisma.post.findUnique({
      where: { slug: validated.slug },
    });
    if (existingSlugPost && existingSlugPost.id !== id) {
      return {
        success: false,
        error: `A post with slug "${validated.slug}" already exists.`,
      };
    }

    const currentPost = await prisma.post.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!currentPost) {
      return { success: false, error: "Post not found" };
    }

    const sanitizedHtml = sanitizePostHtml(validated.contentHtml);
    const plainText = extractPlainText(sanitizedHtml);
    const readingTime = calculateReadingTime(plainText, validated.language as LanguageCode);

    let publishedAt = currentPost.publishedAt;
    if (validated.status === "PUBLISHED") {
      if (validated.publishedAt) {
        publishedAt = new Date(validated.publishedAt);
      } else if (!currentPost.publishedAt) {
        publishedAt = new Date();
      }
    } else {
      publishedAt = null;
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title: validated.title,
        slug: validated.slug,
        excerpt: validated.excerpt || null,
        coverImage: validated.coverImage || null,
        content: validated.content as object,
        contentHtml: sanitizedHtml,
        language: validated.language as Language,
        status: validated.status as PostStatus,
        publishedAt,
        readingTime,
        tags: {
          set: [],
          connectOrCreate: validated.tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${currentPost.slug}`);
    revalidatePath(`/blog/${updated.slug}`);
    revalidatePath("/admin");
    revalidatePath("/rss.xml");
    revalidatePath("/sitemap.xml");
    try {
      updateTag("posts");
    } catch {}

    return { success: true, id: updated.id, slug: updated.slug };
  } catch (err) {
    console.error("updatePostAction database error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update post.",
    };
  }
}

export async function deletePostAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await assertAdminAuthorized();
  } catch {
    return {
      success: false,
      error: "Your admin session expired. Please log in at /admin/login.",
    };
  }

  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return { success: false, error: "Post not found" };
    }

    await prisma.post.delete({ where: { id } });

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin");
    revalidatePath("/rss.xml");
    revalidatePath("/sitemap.xml");
    try {
      updateTag("posts");
    } catch {}

    return { success: true };
  } catch (err) {
    console.error("deletePostAction database error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete post.",
    };
  }
}

export async function togglePostStatusAction(
  id: string
): Promise<{ success: true; status: PostStatus } | { success: false; error: string }> {
  try {
    await assertAdminAuthorized();
  } catch {
    return {
      success: false,
      error: "Your admin session expired. Please log in at /admin/login.",
    };
  }

  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return { success: false, error: "Post not found" };
    }

    const nextStatus =
      post.status === PostStatus.PUBLISHED ? PostStatus.DRAFT : PostStatus.PUBLISHED;
    const publishedAt =
      nextStatus === PostStatus.PUBLISHED ? post.publishedAt || new Date() : null;

    const updated = await prisma.post.update({
      where: { id },
      data: {
        status: nextStatus,
        publishedAt,
      },
    });

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin");
    revalidatePath("/rss.xml");
    revalidatePath("/sitemap.xml");
    try {
      updateTag("posts");
    } catch {}

    return { success: true, status: updated.status };
  } catch (err) {
    console.error("togglePostStatusAction database error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to change status.",
    };
  }
}
