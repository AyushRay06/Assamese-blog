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

export async function POST(request: NextRequest) {
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
  const rateLimit = checkRateLimit(`post-create-${clientIp}`, 30, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const rawData = await request.json();

    // Sanitize and ensure pure primitives
    const rawTitle = String(rawData.title || "").trim();
    const rawSlug = String(rawData.slug || "").trim() || rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const rawCover = rawData.coverImage ? String(rawData.coverImage).trim() : null;
    const rawExcerpt = rawData.excerpt ? String(rawData.excerpt).trim() : null;

    const sanitizedData = {
      title: rawTitle,
      slug: rawSlug || `post-${Date.now()}`,
      excerpt: rawExcerpt && rawExcerpt !== "" ? rawExcerpt : null,
      coverImage: rawCover && rawCover !== "" ? rawCover : null,
      content:
        typeof rawData.content === "object" && rawData.content !== null
          ? rawData.content
          : { type: "doc", content: [] },
      contentHtml: String(rawData.contentHtml || ""),
      language: rawData.language === "AS" ? "AS" : "EN",
      status: rawData.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      publishedAt: rawData.publishedAt ? String(rawData.publishedAt) : null,
      tags: Array.isArray(rawData.tags)
        ? Array.from(new Set(rawData.tags.map((t: unknown) => String(t).trim()).filter(Boolean)))
        : [],
    };

    const parseResult = postSchema.safeParse(sanitizedData);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid blog post data." },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    // Deduplicate slug
    let finalSlug = validated.slug;
    const existing = await prisma.post.findUnique({
      where: { slug: finalSlug },
    });
    if (existing) {
      let counter = 2;
      while (
        await prisma.post.findUnique({
          where: { slug: `${validated.slug}-${counter}` },
        })
      ) {
        counter++;
      }
      finalSlug = `${validated.slug}-${counter}`;
    }

    const sanitizedHtml = sanitizePostHtml(validated.contentHtml);
    const plainText = extractPlainText(sanitizedHtml);
    const readingTime = calculateReadingTime(plainText, validated.language as LanguageCode);

    let publishedAt: Date | null = null;
    if (validated.status === "PUBLISHED") {
      if (validated.publishedAt) {
        const d = new Date(validated.publishedAt);
        publishedAt = isNaN(d.getTime()) ? new Date() : d;
      } else {
        publishedAt = new Date();
      }
    }

    const uniqueTags = Array.from(new Set(validated.tags));

    const post = await prisma.post.create({
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
          connectOrCreate: uniqueTags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
    });

    // Revalidate public and admin pages
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

    return NextResponse.json({
      success: true,
      id: post.id,
      slug: post.slug,
    });
  } catch (error) {
    console.error("Admin post creation API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create blog post." },
      { status: 500 }
    );
  }
}
