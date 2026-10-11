"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  ArrowUp,
  MessageCircle,
  ExternalLink,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

interface ArticleInteractiveBarProps {
  title: string;
  slug: string;
  onFontSizeChange?: (size: "normal" | "comfortable" | "spacious") => void;
}

export function ArticleInteractiveBar({
  title,
  slug,
  onFontSizeChange,
}: ArticleInteractiveBarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "comfortable" | "spacious">("normal");

  // Track window scroll for progress bar & scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getPostUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/blog/${slug}`;
    }
    return `/blog/${slug}`;
  };

  const handleCopyLink = async () => {
    try {
      const url = getPostUrl();
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleShareWhatsApp = () => {
    const url = getPostUrl();
    const text = `Read "${title}" by Prof. Surajit Borkotokey:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareTwitter = () => {
    const url = getPostUrl();
    const text = `"${title}" by Prof. Surajit Borkotokey`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const handleShareLinkedIn = () => {
    const url = getPostUrl();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const handleCycleFontSize = () => {
    const nextSize = fontSize === "normal" ? "comfortable" : fontSize === "comfortable" ? "spacious" : "normal";
    setFontSize(nextSize);
    onFontSizeChange?.(nextSize);
    const sizeName = nextSize === "normal" ? "Standard" : nextSize === "comfortable" ? "Comfortable (+10%)" : "Spacious (+20%)";
    toast.info(`Text size: ${sizeName}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* 1. Global Reading Progress Bar fixed at screen top */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none bg-border/20 backdrop-blur-xs"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-primary via-emerald-500 to-indigo-500 transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Article Interaction Strip */}
      <div className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl border border-border/60 bg-muted/20 backdrop-blur-sm text-muted-foreground my-6">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <Share2 className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Share this essay:</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer",
              copied
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "hover:bg-muted hover:text-foreground border border-border/50"
            )}
            title="Copy post link"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">Copy Link</span>
              </>
            )}
          </button>

          {/* WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="p-1.5 rounded-md hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-border/50 transition-colors cursor-pointer"
            title="Share on WhatsApp"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>

          {/* X (Twitter) */}
          <button
            type="button"
            onClick={handleShareTwitter}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground border border-border/50 transition-colors cursor-pointer"
            title="Share on X"
            aria-label="Share on X"
          >
            <span className="text-[11px] font-mono font-bold leading-none px-0.5">𝕏</span>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={handleShareLinkedIn}
            className="p-1.5 rounded-md hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 border border-border/50 transition-colors cursor-pointer"
            title="Share on LinkedIn"
            aria-label="Share on LinkedIn"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>

          {/* Separator */}
          <div className="h-4 w-px bg-border/60 mx-1" />

          {/* Font Size Adjuster */}
          <button
            type="button"
            onClick={handleCycleFontSize}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono border border-border/50 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title={`Cycle text size (currently ${fontSize})`}
          >
            <Type className="h-3 w-3 text-primary" />
            <span className="text-[11px]">
              {fontSize === "normal" ? "A" : fontSize === "comfortable" ? "A+" : "A++"}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Floating Scroll To Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-2.5 rounded-full bg-card/90 border border-border/80 text-muted-foreground hover:text-foreground hover:bg-card shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in zoom-in-75 cursor-pointer hover:-translate-y-0.5"
          title="Scroll back to top"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </>
  );
}

export default ArticleInteractiveBar;
