"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "cn";

export interface MarqueePost {
  id: string;
  title: string;
  slug: string;
  language: "EN" | "AS" | string;
  readingTime?: number | null;
}

interface HeroBlogMarqueeProps {
  posts?: MarqueePost[];
  className?: string;
}

// Curated scholarly posts if the database currently has few entries
const DEFAULT_SCHOLARLY_TOPICS: MarqueePost[] = [
  {
    id: "topic-1",
    title: "Cooperative Game Theory: Mathematical Models & Applications",
    slug: "blog",
    language: "EN",
    readingTime: 6,
  },
  {
    id: "topic-2",
    title: "গণিত চিন্তা আৰু অসমীয়া সংস্কৃতিৰ ঐতিহাসিক সংযোগ",
    slug: "blog",
    language: "AS",
    readingTime: 8,
  },
  {
    id: "topic-3",
    title: "Network Games & Strategic Coalitions in Social Structures",
    slug: "blog",
    language: "EN",
    readingTime: 5,
  },
];

export function HeroBlogMarquee({ posts = [], className }: HeroBlogMarqueeProps) {
  // Combine real posts with scholarly topics to maintain a rich vertical loop
  const displayPosts = useMemo(() => {
    if (posts && posts.length >= 3) {
      return posts;
    }
    if (posts && posts.length > 0) {
      // Put real posts first, then supplement
      const realSlugs = new Set(posts.map((p) => p.slug));
      const filteredDefaults = DEFAULT_SCHOLARLY_TOPICS.filter((t) => !realSlugs.has(t.slug));
      return [...posts, ...filteredDefaults];
    }
    return DEFAULT_SCHOLARLY_TOPICS;
  }, [posts]);

  // Ensure minimum items in track so vertical animation is seamless
  const repeatedPosts = useMemo(() => {
    let list: MarqueePost[] = [];
    while (list.length < 6) {
      list = [...list, ...displayPosts];
    }
    return list;
  }, [displayPosts]);

  const renderPostCard = (post: MarqueePost, uniqueKey: string) => {
    const isAssamese = post.language === "AS";
    const href = post.slug === "blog" ? "/blog" : `/blog/${post.slug}`;

    return (
      <Link
        key={uniqueKey}
        href={href}
        className="group/card flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-border/70 bg-card/90 hover:bg-card hover:border-foreground/30 hover:shadow-xs transition-all select-none cursor-pointer"
        title={post.title}
      >
        <div className="space-y-1 min-w-0 flex-1 text-left">
          {/* Tag & Reading Time */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded font-medium shrink-0",
                isAssamese
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-primary/10 text-primary border border-primary/20"
              )}
            >
              {isAssamese ? "অসমীয়া" : "English"}
            </span>

            {post.readingTime && (
              <span className="text-[11px] font-mono text-muted-foreground/70">
                {post.readingTime} min read
              </span>
            )}
          </div>

          {/* Title */}
          <h4
            className={cn(
              "text-xs sm:text-[13px] font-semibold tracking-tight text-foreground group-hover/card:text-primary transition-colors line-clamp-1",
              isAssamese && "font-assamese"
            )}
          >
            {post.title}
          </h4>
        </div>

        {/* Action Icon */}
        <div className="p-1.5 rounded-lg bg-muted/40 text-muted-foreground group-hover/card:bg-foreground group-hover/card:text-background transition-all shrink-0">
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" />
        </div>
      </Link>
    );
  };

  return (
    <div className={cn("w-full max-w-lg lg:max-w-xl pt-1 sm:pt-2", className)}>
      <div className="rounded-2xl border border-border/80 bg-card/75 backdrop-blur-md overflow-hidden shadow-xs">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/25">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="tracking-wider uppercase font-semibold">
              Recent Writings &bull; শেহতীয়া লেখা
            </span>
          </div>

          <Link
            href="/blog"
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            title="Browse all blog essays"
          >
            <span>All Posts</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Vertical Marquee Window */}
        <div className="relative h-[185px] sm:h-[200px] overflow-hidden p-2.5">
          {/* Top & Bottom Soft Gradient Fades */}
          <div
            className="pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-card via-card/70 to-transparent z-10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-card via-card/70 to-transparent z-10"
            aria-hidden="true"
          />

          {/* Vertical Scrolling Track */}
          <div
            className="flex flex-col animate-marquee-vertical hover:[animation-play-state:paused] gap-2.5"
            style={{ animationDuration: "20s" }}
          >
            {/* Set A */}
            <div className="flex flex-col gap-2.5 shrink-0">
              {repeatedPosts.map((post, idx) =>
                renderPostCard(post, `v-track-a-${post.id}-${idx}`)
              )}
            </div>

            {/* Set B (exact duplicate for seamless infinite vertical looping) */}
            <div className="flex flex-col gap-2.5 shrink-0" aria-hidden="true">
              {repeatedPosts.map((post, idx) =>
                renderPostCard(post, `v-track-b-${post.id}-${idx}`)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroBlogMarquee;
