"use client";

import React, { useState } from "react";
import { LanguageCode } from "@/lib/languages";
import { PostContent } from "./PostContent";
import { ArticleInteractiveBar } from "./ArticleInteractiveBar";

interface ArticleReaderViewProps {
  contentHtml: string;
  language: LanguageCode;
  title: string;
  slug: string;
  initialLikes?: number;
}

export function ArticleReaderView({
  contentHtml,
  language,
  title,
  slug,
  initialLikes = 0,
}: ArticleReaderViewProps) {
  const [fontSize, setFontSize] = useState<"normal" | "comfortable" | "spacious">("normal");

  return (
    <div className="space-y-4">
      {/* Top interactive utility strip (reading progress bar, social share, font size scaler, like button) */}
      <ArticleInteractiveBar
        title={title}
        slug={slug}
        initialLikes={initialLikes}
        onFontSizeChange={setFontSize}
      />

      {/* Styled Article Prose Content */}
      <PostContent
        contentHtml={contentHtml}
        language={language}
        fontSize={fontSize}
      />
    </div>
  );
}

export default ArticleReaderView;
