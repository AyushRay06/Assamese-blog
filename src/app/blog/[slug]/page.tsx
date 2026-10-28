import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPublishedPostBySlug, getRelatedPosts } from "@/lib/posts";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/languages";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { ArticleReaderView } from "@/components/blog/ArticleReaderView";
import { BlogCoverImage } from "@/components/blog/BlogCoverImage";
import { BlogLikeButton } from "@/components/blog/BlogLikeButton";
import { BlogCommentsSection } from "@/components/blog/BlogCommentsSection";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { cn } from "cn";
import { BlogPostJsonLd } from "@/components/seo/JsonLd";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) {
    return [];
  }
  try {
    const posts = await prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      select: { slug: true },
    });
    return posts.map((post) => ({ slug: post.slug }));
  } catch (err) {
    console.warn("generateStaticParams: unable to fetch posts at build time, using dynamic fallback:", err);
    return [];
  }
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
  const isAssamese = post.language === "AS";

  return {
    title: `${post.title} | Prof. Surajit Borkotokey`,
    description: post.excerpt || `Read "${post.title}" by Prof. Surajit Borkotokey.`,
    authors: [{ name: "Prof. Surajit Borkotokey", url: siteUrl }],
    creator: "Prof. Surajit Borkotokey",
    publisher: "Prof. Surajit Borkotokey",
    keywords: [
      post.title,
      "Prof. Surajit Borkotokey",
      "Surajit Borkotokey",
      "Dibrugarh University",
      isAssamese ? "অসমীয়া প্ৰবন্ধ" : "English Essay",
      ...(post.tags?.map((t) => t.name) || []),
    ],
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
      locale: isAssamese ? "as_IN" : "en_US",
      images: post.coverImage
        ? [{ url: post.coverImage }]
        : [{ url: `${siteUrl}/images/surajit-borkotokey-hero.jpg` }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || undefined,
      images: post.coverImage
        ? [post.coverImage]
        : [`${siteUrl}/images/surajit-borkotokey-hero.jpg`],
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

  // Fetch more published articles for seamless reader engagement
  const relatedPosts = await getRelatedPosts(post.id, 2);

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
    <div className="flex min-h-screen flex-col bg-background relative selection:bg-primary/20 selection:text-foreground">
      <BlogPostJsonLd
        title={post.title}
        description={post.excerpt || post.title}
        slug={post.slug}
        publishedAt={post.publishedAt}
        updatedAt={post.updatedAt}
        coverImage={post.coverImage}
        language={post.language}
      />
      <PublicHeader />

      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          {/* Clean Navigation */}
          <nav className="mb-6 flex items-center justify-between text-xs font-mono">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to writings</span>
            </Link>

            <span className="text-[11px] text-muted-foreground/70 font-mono">
              {langConfig.nativeName}
            </span>
          </nav>

          {/* Article Header Section */}
          <header className="mb-8 space-y-4">
            {/* Meta: Language, Date, Reading time */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border/70 bg-muted/30 text-foreground font-medium text-[11px]">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isAssamese ? "bg-emerald-500" : "bg-primary"
                  )}
                />
                <span>{langConfig.nativeName}</span>
              </span>
              <span>&bull;</span>
              <time dateTime={post.publishedAt?.toISOString()}>
                {publishedDate}
              </time>
              <span>&bull;</span>
              <span>{readingTimeText}</span>
            </div>

            {/* Post Title */}
            <h1
              lang={langConfig.langAttr}
              className={cn(
                "font-bold tracking-tight text-foreground leading-[1.25]",
                isAssamese
                  ? "font-assamese text-3xl sm:text-4xl lg:text-[42px]"
                  : "font-heading text-3xl sm:text-4xl lg:text-[44px]"
              )}
            >
              {post.title}
            </h1>

            {/* Post Subtitle / Excerpt (Natural editorial typography, no clunky box) */}
            {post.excerpt && (
              <p
                lang={langConfig.langAttr}
                className={cn(
                  "text-base sm:text-lg text-muted-foreground/90 leading-relaxed pt-1",
                  isAssamese ? "font-assamese" : "font-serif"
                )}
              >
                {post.excerpt}
              </p>
            )}

            {/* Clean Author Byline */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-border/80">
                  <Image
                    src="/images/surajit-borkotokey.jpg"
                    alt="Prof. Surajit Borkotokey"
                    fill
                    sizes="36px"
                    className="object-cover object-top"
                  />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    Prof. Surajit Borkotokey
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Professor of Mathematics &bull; Dibrugarh University
                  </p>
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-muted/40 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Framed Cover Image (Clean, without distracting neon glow) */}
          {post.coverImage && (
            <div className="relative mb-10 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              <BlogCoverImage
                src={post.coverImage}
                alt={post.title}
                isAssamese={isAssamese}
                priority={true}
                sizes="(max-width: 768px) 100vw, 840px"
                aspectClass="aspect-[16/9]"
                className="object-cover"
              />
            </div>
          )}

          {/* Article Body with dynamic font size scaler, like button, and interactive bar */}
          <article lang={langConfig.langAttr} className="relative">
            <ArticleReaderView
              contentHtml={post.contentHtml}
              language={langCode}
              title={post.title}
              slug={post.slug}
              initialLikes={post.likes ?? 0}
            />
          </article>

          {/* Prominent Reaction & Like Card */}
          <div className="mt-12">
            <BlogLikeButton
              slug={post.slug}
              initialLikes={post.likes ?? 0}
              variant="prominent"
            />
          </div>

          {/* Author Biography Section */}
          <section className="mt-12 p-5 sm:p-6 rounded-2xl border border-border/50 bg-card/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border/80">
                <Image
                  src="/images/surajit-borkotokey.jpg"
                  alt="Prof. Surajit Borkotokey"
                  fill
                  sizes="56px"
                  className="object-cover object-top"
                />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-semibold text-base text-foreground">
                    Prof. Surajit Borkotokey
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Author &amp; Researcher
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Professor of Mathematics at Dibrugarh University, Assam. Specializes in Cooperative Game Theory and Network Science, writing bilingual reflections on mathematics, science, education, and Assamese heritage.
                </p>
                <div className="flex items-center gap-4 pt-1 text-xs font-mono text-primary">
                  <Link href="/#research" className="hover:underline inline-flex items-center gap-1">
                    <span>Research Projects</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Link href="/#contact" className="hover:underline inline-flex items-center gap-1">
                    <span>Contact</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Comments & Reader Feedback */}
          <BlogCommentsSection
            slug={post.slug}
            isAssamese={isAssamese}
          />

          {/* Related / More Writings Section */}
          {relatedPosts && relatedPosts.length > 0 && (
            <section className="mt-14 pt-10 border-t border-border/60">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    More Writings
                  </h3>
                </div>
                <Link
                  href="/blog"
                  className="text-xs font-mono text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedPosts.map((relPost) => {
                  const relLangConfig = SUPPORTED_LANGUAGES[relPost.language as LanguageCode];
                  const relIsAssamese = relPost.language === "AS";
                  const relDate = relPost.publishedAt
                    ? new Date(relPost.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "";

                  return (
                    <Link
                      key={relPost.id}
                      href={`/blog/${relPost.slug}`}
                      className="group flex flex-col p-4 rounded-xl border border-border/70 bg-card hover:border-foreground/30 hover:shadow-md transition-all"
                    >
                      {/* Cover Preview */}
                      {relPost.coverImage && (
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg mb-3 bg-muted">
                          <Image
                            src={relPost.coverImage}
                            alt={relPost.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 360px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-1.5">
                        <span className="font-medium text-foreground">
                          {relLangConfig.nativeName}
                        </span>
                        <span>&bull;</span>
                        <span>{relDate}</span>
                        <span>&bull;</span>
                        <span>{relPost.readingTime} min</span>
                      </div>

                      <h4
                        className={cn(
                          "font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug",
                          relIsAssamese ? "font-assamese text-base" : "text-sm"
                        )}
                      >
                        {relPost.title}
                      </h4>

                      {relPost.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {relPost.excerpt}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bottom Navigation */}
          <div className="mt-14 pt-8 border-t border-border/60 flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to all writings</span>
            </Link>

            <Link
              href="/"
              className="text-xs font-mono text-primary hover:underline"
            >
              Return Home &rarr;
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
