"use server";

import prisma from "@/lib/prisma";
import { postSchema, PostInput } from "@/lib/validations";
import { sanitizePostHtml } from "@/lib/sanitize";
import { calculateReadingTime, LanguageCode } from "@/lib/languages";
import { assertAdminAuthorized } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PostStatus, Language } from "@prisma/client";

function extractPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function createPostAction(data: PostInput) {
  await assertAdminAuthorized();

  const validated = postSchema.parse(data);

  // Check slug uniqueness
  const existing = await prisma.post.findUnique({
    where: { slug: validated.slug },
  });
  if (existing) {
    throw new Error(`A post with slug "${validated.slug}" already exists. Please choose a different slug.`);
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
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");

  return { success: true, id: post.id, slug: post.slug };
}

export async function updatePostAction(id: string, data: PostInput) {
  await assertAdminAuthorized();

  const validated = postSchema.parse(data);

  // Check slug uniqueness if changed
  const existingSlugPost = await prisma.post.findUnique({
    where: { slug: validated.slug },
  });
  if (existingSlugPost && existingSlugPost.id !== id) {
    throw new Error(`A post with slug "${validated.slug}" already exists.`);
  }

  const currentPost = await prisma.post.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!currentPost) {
    throw new Error("Post not found");
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
    // If explicitly set to DRAFT, keep original publishedAt or null depending on intent
    // Keeping publishedAt null for drafts ensures drafts are unlisted
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
        set: [], // clear previous relation and reconnect
        connectOrCreate: validated.tags.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath(`/blog/${currentPost.slug}`);
  revalidatePath(`/blog/${updated.slug}`);
  revalidatePath("/admin");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");

  return { success: true, id: updated.id, slug: updated.slug };
}

export async function deletePostAction(id: string) {
  await assertAdminAuthorized();

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    throw new Error("Post not found");
  }

  await prisma.post.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");

  return { success: true };
}

export async function togglePostStatusAction(id: string) {
  await assertAdminAuthorized();

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    throw new Error("Post not found");
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
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");

  return { success: true, status: updated.status };
}
