"use client";

import React from "react";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/languages";
import { cn } from "cn";

interface PostContentProps {
  contentHtml: string;
  language: LanguageCode;
  className?: string;
  fontSize?: "normal" | "comfortable" | "spacious";
}

export function PostContent({
  contentHtml,
  language,
  className = "",
  fontSize = "normal",
}: PostContentProps) {
  const isAssamese = language === "AS";
  const langConfig = SUPPORTED_LANGUAGES[language];

  // Dynamic text size calculation
  let textClass = isAssamese
    ? "text-[19px] sm:text-[20px] leading-loose"
    : "text-[17px] sm:text-[18px] leading-relaxed";

  if (fontSize === "comfortable") {
    textClass = isAssamese
      ? "text-[21px] sm:text-[22px] leading-loose"
      : "text-[19px] sm:text-[20px] leading-relaxed";
  } else if (fontSize === "spacious") {
    textClass = isAssamese
      ? "text-[23px] sm:text-[24px] leading-loose"
      : "text-[21px] sm:text-[22px] leading-loose";
  }

  return (
    <div
      lang={langConfig.langAttr}
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none transition-all duration-200",
        // Typography & Headings
        "prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-headings:scroll-mt-24",
        "prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2.5 prose-h2:mt-12 prose-h2:mb-4",
        "prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3",
        // Body text & spacing
        "prose-p:text-foreground/90 prose-p:my-5",
        textClass,
        isAssamese ? "font-assamese" : "font-sans",
        // Links
        "prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80 transition-colors",
        // Blockquotes
        "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/20 prose-blockquote:py-3.5 prose-blockquote:px-5 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:text-foreground/90 prose-blockquote:my-6 prose-blockquote:shadow-2xs",
        // Code Blocks
        "prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-border/60 prose-pre:rounded-xl prose-pre:shadow-sm",
        "prose-code:text-primary prose-code:bg-muted/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.9em] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
        // Lists
        "prose-li:marker:text-primary prose-li:my-1.5",
        // Horizontal Rules
        "prose-hr:border-border/50 prose-hr:my-10",
        // In-body images
        "prose-img:rounded-2xl prose-img:border prose-img:border-border/60 prose-img:shadow-md prose-img:my-8",
        className
      )}
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}

export default PostContent;
