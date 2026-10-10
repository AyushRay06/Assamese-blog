import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { postSchema } from "@/lib/validations";
import { sanitizePostHtml } from "@/lib/sanitize";
import { calculateReadingTime, LanguageCode } from "@/lib/languages";
import { verifyBasicAuthHeader, checkRateLimit } from "@/lib/auth";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { PostStatus, Language } from "@prisma/client";

function extractPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  // 1. Authorization check
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isSessionValid = sessionCookie ? await verifySessionToken(sessionCookie) : false;
  const authHeader = request.headers.get("authorization");
  const isBasicValid = verifyBasicAuthHeader(authHeader);

  if (!isSessionValid && !isBasicValid) {
    return NextResponse.json(
      { error: "Unauthorized: Admin session expired. Please log in at /admin/login." },
      { status: 401 }
    );
  }

  // 2. Rate limiting
  const clientIp = request.headers.get("x-forwarded-for") || "admin-client";
  const rateLimit = checkRateLimit(`post-update-${clientIp}`, 60, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many update requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const rawData = await request.json();

    const sanitizedData = {
      title: String(rawData.title || "").trim(),
      slug: String(rawData.slug || "").trim(),
      excerpt: rawData.excerpt ? String(rawData.excerpt).trim() : null,
      coverImage: rawData.coverImage ? String(rawData.coverImage).trim() : null,
      content:
        typeof rawData.content === "object" && rawData.content !== null
          ? rawData.content
          : { type: "doc", content: [] },
      contentHtml: String(rawData.contentHtml || ""),
      language: rawData.language === "AS" ? "AS" : "EN",
      status: rawData.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      publishedAt: rawData.publishedAt ? String(rawData.publishedAt) : null,
      tags: Array.isArray(rawData.tags)
        ? rawData.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [],
    };

    const parseResult = postSchema.safeParse(sanitizedData);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid post data provided." },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Slug deduplication if changed
    let finalSlug = validated.slug;
    if (finalSlug !== existingPost.slug) {
      const slugCollision = await prisma.post.findFirst({
        where: { slug: finalSlug, NOT: { id } },
      });
      if (slugCollision) {
        let counter = 2;
        while (
          await prisma.post.findFirst({
            where: { slug: `${validated.slug}-${counter}`, NOT: { id } },
          })
        ) {
          counter++;
        }
        finalSlug = `${validated.slug}-${counter}`;
      }
    }

    const sanitizedHtml = sanitizePostHtml(validated.contentHtml);
    const plainText = extractPlainText(sanitizedHtml);
    const readingTime = calculateReadingTime(plainText, validated.language as LanguageCode);

    let publishedAt = existingPost.publishedAt;
    if (validated.status === "PUBLISHED") {
      if (!publishedAt) {
        publishedAt = validated.publishedAt ? new Date(validated.publishedAt) : new Date();
      } else if (validated.publishedAt) {
        publishedAt = new Date(validated.publishedAt);
      }
    } else {
      publishedAt = null;
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title: validated.title,
        slug: finalSlug,
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

    try {
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath(`/blog/${existingPost.slug}`);
      revalidatePath(`/blog/${updated.slug}`);
      revalidatePath("/admin");
      revalidatePath("/rss.xml");
      revalidatePath("/sitemap.xml");
    } catch (revErr) {
      console.warn("Revalidation warning:", revErr);
    }

    return NextResponse.json({
      success: true,
      id: updated.id,
      slug: updated.slug,
    });
  } catch (error) {
    console.error("Admin post update API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update blog post." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isSessionValid = sessionCookie ? await verifySessionToken(sessionCookie) : false;
  const authHeader = request.headers.get("authorization");
  const isBasicValid = verifyBasicAuthHeader(authHeader);

  if (!isSessionValid && !isBasicValid) {
    return NextResponse.json(
      { error: "Unauthorized: Admin session required." },
      { status: 401 }
    );
  }

  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.post.delete({ where: { id } });

    try {
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
      revalidatePath("/admin");
      revalidatePath("/rss.xml");
      revalidatePath("/sitemap.xml");
    } catch (revErr) {
      console.warn("Revalidation warning:", revErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin post delete API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete post." },
      { status: 500 }
    );
  }
}
