import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedPostBySlug } from "@/lib/posts";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/languages";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { PostContent } from "@/components/blog/PostContent";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { PostStatus } from "@prisma/client";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    select: { slug: true },
  });
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt || `Read "${post.title}" on Bilingual Notebook.`,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url: postUrl,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function SinglePostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  // Requirement: Draft posts must return 404 on public routes
  if (!post) {
    notFound();
  }

  const langCode = post.language as LanguageCode;
  const langConfig = SUPPORTED_LANGUAGES[langCode];
  const isAssamese = langCode === "AS";

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  const readingTimeText = isAssamese
    ? `${post.readingTime} মিনিট পঢ়া`
    : `${post.readingTime} min read`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 py-10 sm:py-16">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          {/* Back Navigation */}
          <Link
            href="/blog"
            className="group mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to writings</span>
          </Link>

          {/* Article Header */}
          <header className="mb-10 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge
                variant={isAssamese ? "default" : "secondary"}
                className="rounded-none font-medium text-xs border border-border/60"
              >
                {langConfig.nativeName}
              </Badge>

              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <time dateTime={post.publishedAt?.toISOString()}>
                    {publishedDate}
                  </time>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{readingTimeText}</span>
                </span>
              </div>
            </div>

            <h1
              lang={langConfig.langAttr}
              className={`font-bold tracking-tight text-foreground ${
                isAssamese
                  ? "font-assamese text-3xl sm:text-4xl lg:text-5xl leading-tight"
                  : "font-heading text-3xl sm:text-4xl lg:text-5xl leading-tight"
              }`}
            >
              {post.title}
            </h1>

            {/* Author Attribution */}
            <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground font-mono border-l-2 border-primary pl-3">
              <span>Prof. Surajit Borkotokey</span>
              <span>&bull;</span>
              <span>Dibrugarh University</span>
            </div>

            {post.excerpt && (
              <p
                lang={langConfig.langAttr}
                className={`text-lg sm:text-xl text-muted-foreground ${
                  isAssamese ? "font-assamese leading-relaxed" : "leading-relaxed"
                }`}
              >
                {post.excerpt}
              </p>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-none border border-border/60 bg-secondary/60 px-2.5 py-0.5 text-xs font-mono text-secondary-foreground"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative mb-12 aspect-[16/9] w-full overflow-hidden rounded-none border border-border bg-muted">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
            </div>
          )}

          {/* Article Body */}
          <article lang={langConfig.langAttr} className="border-t border-border/40 pt-8">
            <PostContent
              contentHtml={post.contentHtml}
              language={langCode}
            />
          </article>

          {/* Post Footer */}
          <div className="mt-16 border-t border-border/60 pt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Explore more writings</span>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
