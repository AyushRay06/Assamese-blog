import { getCachedPublishedPosts, getCachedPostCounts } from "@/lib/posts";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { PostCard } from "@/components/blog/PostCard";
import { LanguageFilter } from "@/components/blog/LanguageFilter";
import { Pagination } from "@/components/blog/Pagination";
import { EmptyState } from "@/components/blog/EmptyState";
import BookshelfFigure from "@/components/hairline/BookshelfFigure";
import { GridMarqueeDivider } from "@/components/ui/GridMarqueeDivider";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blogs & Writings | Prof. Surajit Borkotokey",
  description:
    "Bilingual scholarly archive of essays, mathematical notes, and cultural reflections across English and Assamese by Prof. Surajit Borkotokey.",
};

interface BlogArchivePageProps {
  searchParams: Promise<{
    lang?: string;
    page?: string;
  }>;
}

export default async function BlogArchivePage({ searchParams }: BlogArchivePageProps) {
  const params = await searchParams;
  const rawLang = params.lang?.toUpperCase();
  const activeLang = rawLang === "EN" || rawLang === "AS" ? rawLang : undefined;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // Cached, lightning-fast queries
  const [postsData, counts] = await Promise.all([
    getCachedPublishedPosts(activeLang, currentPage, 12),
    getCachedPostCounts(),
  ]);

  const { posts, totalPages } = postsData;

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-foreground selection:text-background">
      <PublicHeader />

      <main className="flex-1">
        {/* Editorial Header Section with Bookshelf Figure */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
              {/* Left Column: Title, Intro, Language Tabs */}
              <div className="space-y-6 lg:col-span-7">
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Bilingual Archive &bull; দ্বিভাষিক সংগ্ৰহ
                  </div>
                  <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
                    Blogs &amp; Writings
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1">
                    Essays and critical reflections on cooperative game theory, applied mathematical foundations, higher education dynamics, and Assamese cultural narratives.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="pt-2">
                  <LanguageFilter
                    currentLang={activeLang || "ALL"}
                    basePath="/blog"
                    totalCounts={{
                      all: counts.all,
                      en: counts.en,
                      as: counts.as,
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Bookshelf Figure (Free-standing, pure figure) */}
              <div className="flex flex-col items-center lg:items-end lg:col-span-5">
                <div className="w-full max-w-[320px] sm:max-w-[350px]">
                  <div className="relative aspect-[5/4] w-full select-none cursor-pointer">
                    <BookshelfFigure
                      intensity={0.7}
                      play={true}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Continuous straight-line grid divider marquee */}
        <GridMarqueeDivider />

        {/* Article Grid Section */}
        <section className="py-14 sm:py-20">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, idx) => (
                  <PostCard key={post.id} post={post} priority={idx < 3} />
                ))}
              </div>
            ) : (
              <div className="py-20">
                <EmptyState activeLang={activeLang} />
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              lang={activeLang}
              basePath="/blog"
            />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
