"use client";

import * as React from "react";
import { PostCard } from "@/components/blog/PostCard";
import { LanguageFilter } from "@/components/blog/LanguageFilter";
import { Pagination } from "@/components/blog/Pagination";
import { EmptyState } from "@/components/blog/EmptyState";

interface WritingsSectionProps {
  posts: any[];
  totalPages: number;
  currentPage: number;
  activeLang?: string;
  totalCounts: {
    all: number;
    en: number;
    as: number;
  };
}

export function WritingsSection({
  posts,
  totalPages,
  currentPage,
  activeLang,
  totalCounts,
}: WritingsSectionProps) {
  return (
    <section id="essays" className="relative py-16 sm:py-24">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        {/* Clean, airy header row with Title & Language Filter */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-border/40">
          <div className="space-y-2 max-w-xl">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Bilingual Archive &bull; দ্বিভাষিক সংগ্ৰহ
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Essays, Notes &amp; Reflections
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Critical reflections, mathematical notes, and cultural commentaries written across English and Assamese.
            </p>
          </div>

          <div className="shrink-0">
            <LanguageFilter currentLang={activeLang || "ALL"} totalCounts={totalCounts} />
          </div>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, idx) => (
              <PostCard key={post.id} post={post} priority={idx < 3} />
            ))}
          </div>
        ) : (
          <div className="py-16">
            <EmptyState activeLang={activeLang} />
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          lang={activeLang}
        />
      </div>
    </section>
  );
}
export default WritingsSection;
