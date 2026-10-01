import { getPublishedPosts } from "@/lib/posts";
import prisma from "@/lib/prisma";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { PostCard } from "@/components/blog/PostCard";
import { LanguageFilter } from "@/components/blog/LanguageFilter";
import { Pagination } from "@/components/blog/Pagination";
import { PostStatus, Language } from "@prisma/client";

export const revalidate = 60; // revalidate every 60s or on demand

interface HomePageProps {
  searchParams: Promise<{
    lang?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const rawLang = params.lang?.toUpperCase();
  const activeLang = rawLang === "EN" || rawLang === "AS" ? rawLang : undefined;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // Fetch posts and counts in parallel
  const [postsData, totalAll, totalEn, totalAs] = await Promise.all([
    getPublishedPosts({
      language: activeLang,
      page: currentPage,
      limit: 9,
    }),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED, language: Language.EN } }),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED, language: Language.AS } }),
  ]);

  const { posts, totalPages } = postsData;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-muted/50 via-background to-background py-16 sm:py-24">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                <span>Bilingual Archive &bull; দ্বিভাষিক সংগ্ৰহ</span>
              </div>

              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
                Words, Ideas &amp; Curiosities.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Essays, technical notes, and cultural reflections published across English and Assamese.
              </p>
            </div>
          </div>
        </section>

        {/* Content Feed Section */}
        <section className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <LanguageFilter
            currentLang={activeLang || "ALL"}
            totalCounts={{
              all: totalAll,
              en: totalEn,
              as: totalAs,
            }}
          />

          {posts.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, idx) => (
                <PostCard key={post.id} post={post} priority={idx < 3} />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
              <div className="rounded-full bg-muted p-4 text-muted-foreground">
                📝
              </div>
              <h3 className="mt-4 font-semibold text-lg text-foreground">
                No published posts found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeLang
                  ? `There are currently no published posts in this language category.`
                  : `Check back soon for new reflections and stories.`}
              </p>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            lang={activeLang}
          />
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
