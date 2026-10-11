"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, ArrowUpRight } from "lucide-react";
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

export function HeroBlogMarquee({ posts = [], className }: HeroBlogMarqueeProps) {
  // If no posts yet in database, provide representative scholarly topics
  const fallbackPosts: MarqueePost[] = [
    {
      id: "fallback-1",
      title: "Cooperative Game Theory & Academic Reflections",
      slug: "blog",
      language: "EN",
      readingTime: 5,
    },
    {
      id: "fallback-2",
      title: "দ্বিভাষিক সংগ্ৰহ: অসমীয়া সংস্কৃতি আৰু গণিত চিন্তা",
      slug: "blog",
      language: "AS",
      readingTime: 6,
    },
    {
      id: "fallback-3",
      title: "Strategic Decision Models & Network Games",
      slug: "blog",
      language: "EN",
      readingTime: 4,
    },
  ];

  const displayPosts = posts && posts.length > 0 ? posts : fallbackPosts;

  // Duplicate items so the marquee track has sufficient length to loop seamlessly without gaps
  const repeatedPosts = React.useMemo(() => {
    let result: MarqueePost[] = [];
    while (result.length < 8) {
      result = [...result, ...displayPosts];
    }
    return result;
  }, [displayPosts]);

  const renderPostPill = (post: MarqueePost, uniqueKey: string) => {
    const isAssamese = post.language === "AS";
    const href = post.slug === "blog" ? "/blog" : `/blog/${post.slug}`;

    return (
      <Link
        key={uniqueKey}
        href={href}
        className="group/item inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/70 bg-card/90 hover:bg-card hover:border-foreground/30 text-foreground transition-all shadow-2xs shrink-0 select-none cursor-pointer"
        title={post.title}
      >
        {/* Language Badge */}
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded font-medium shrink-0",
            isAssamese
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-primary/10 text-primary border border-primary/20"
          )}
        >
          {isAssamese ? "অসমীয়া" : "EN"}
        </span>

        {/* Title */}
        <span
          className={cn(
            "text-xs font-medium tracking-tight text-foreground/90 group-hover/item:text-primary transition-colors max-w-[220px] sm:max-w-[280px] truncate",
            isAssamese && "font-assamese"
          )}
        >
          {post.title}
        </span>

        {/* Reading Time */}
        {post.readingTime && (
          <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0 hidden sm:inline">
            &bull; {post.readingTime}m
          </span>
        )}

        {/* Arrow */}
        <ArrowUpRight className="h-3 w-3 text-muted-foreground/70 group-hover/item:text-primary group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-all shrink-0" />
      </Link>
    );
  };

  return (
    <div className={cn("w-full max-w-xl pt-2 sm:pt-3", className)}>
      <div className="group relative flex items-center overflow-hidden rounded-xl border border-border/80 bg-muted/20 backdrop-blur-xs p-1.5 sm:p-2 shadow-2xs">
        {/* Left Static Badge */}
        <Link
          href="/blog"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-mono font-medium shrink-0 z-20 shadow-xs hover:bg-foreground/90 transition-colors select-none"
          title="Explore all writings"
        >
          <BookOpen className="h-3 w-3" />
          <span className="tracking-wider uppercase font-semibold">Blogs</span>
        </Link>

        {/* Left & Right Gradient Fade Masks */}
        <div className="pointer-events-none absolute left-[88px] top-0 bottom-0 w-6 bg-gradient-to-r from-muted/40 via-muted/20 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background/90 via-background/40 to-transparent z-10" />

        {/* Infinite Scrolling Marquee Track */}
        <div className="flex overflow-hidden w-full ml-2.5">
          <div
            className="flex w-max animate-marquee hover:[animation-play-state:paused] items-center gap-2.5"
            style={{ animationDuration: "36s" }}
          >
            {/* Set A */}
            <div className="flex items-center gap-2.5 shrink-0">
              {repeatedPosts.map((post, idx) =>
                renderPostPill(post, `track-a-${post.id}-${idx}`)
              )}
            </div>

            {/* Set B (exact duplicate for seamless looping) */}
            <div className="flex items-center gap-2.5 shrink-0" aria-hidden="true">
              {repeatedPosts.map((post, idx) =>
                renderPostPill(post, `track-b-${post.id}-${idx}`)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroBlogMarquee;
