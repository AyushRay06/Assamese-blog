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
}

export function ArticleReaderView({
  contentHtml,
  language,
  title,
  slug,
}: ArticleReaderViewProps) {
  const [fontSize, setFontSize] = useState<"normal" | "comfortable" | "spacious">("normal");

  return (
    <div className="space-y-4">
      {/* Top interactive utility strip (reading progress bar, social share, font size scaler) */}
      <ArticleInteractiveBar
        title={title}
        slug={slug}
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
