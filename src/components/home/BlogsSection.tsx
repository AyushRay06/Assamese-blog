import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { getCachedPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/blog/PostCard";

export async function BlogsSection() {
  const { posts, totalCount } = await getCachedPublishedPosts(undefined, 1, 3);

  return (
    <section id="blog" className="relative py-16 sm:py-24">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header row with Title & Direct 1-Click Blogs Link */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-border/40">
          <div className="space-y-2 max-w-xl">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
              <span>Bilingual Archive &bull; দ্বিভাষিক সংগ্ৰহ</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Blogs &amp; Writings
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Essays, mathematical notes, and reflections on cooperative game theory, network games, and Assamese cultural narratives.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/blog"
              prefetch={true}
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-foreground text-background px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-medium transition-all hover:bg-foreground/90 active:scale-95 shadow-xs"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Go to Blogs Page</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Posts Preview or Gateway Card */}
        {posts && posts.length > 0 ? (
          <div className="mt-10 space-y-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, idx) => (
                <PostCard key={post.id} post={post} priority={idx < 3} />
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Link
                href="/blog"
                prefetch={true}
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-6 py-3 text-xs font-mono uppercase tracking-wider text-foreground hover:bg-muted/70 transition-all active:scale-95"
              >
                <span>Browse All Articles ({totalCount || posts.length})</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-border/70 bg-card/50 p-8 sm:p-12 text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-foreground">
                Scholarly Archive &amp; Essays
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Explore bilingual essays on cooperative game theory, network games, fuzzy logic, and Assamese literature.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/blog"
                prefetch={true}
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-xs font-mono uppercase tracking-wider font-medium hover:bg-foreground/90 transition-all active:scale-95 shadow-xs"
              >
                <span>Open Blogs Archive</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default BlogsSection;
