"use client";

import { useState } from "react";
import Image from "next/image";
import { Format } from "@lucasmarkes/hairline/react";

interface BlogCoverImageProps {
  src: string | null | undefined;
  alt: string;
  isAssamese?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  aspectClass?: string;
  usePlaceholder?: boolean;
}

export function BlogCoverImage({
  src,
  alt,
  isAssamese = false,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  className = "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]",
  aspectClass = "aspect-[16/9]",
  usePlaceholder = false,
}: BlogCoverImageProps) {
  const [hasError, setHasError] = useState(false);

  const shouldShowImage = Boolean(src && src.trim() && !hasError);

  if (!shouldShowImage) {
    if (!usePlaceholder) {
      return null;
    }

    return (
      <div
        className={`relative ${aspectClass} w-full overflow-hidden bg-gradient-to-br from-muted/50 via-muted/25 to-muted/10 flex items-center justify-center select-none`}
      >
        {/* Subtle dot matrix pattern */}
        <div
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        {/* Hairline figure placeholder */}
        <div className="relative h-20 w-24 sm:h-22 sm:w-28 opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300">
          <Format intensity={0.55} play={true} className="h-full w-full" />
        </div>

        {/* Minimal Monospace Tag */}
        <div className="absolute bottom-2.5 right-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 bg-background/60 backdrop-blur-xs px-2 py-0.5 rounded border border-border/40">
            {isAssamese ? "অসমীয়া নিবন্ধ" : "Essay"}
          </span>
        </div>
      </div>
    );
  }

  const isDataOrBlob = Boolean(
    src?.startsWith("data:") || src?.startsWith("blob:")
  );

  return (
    <div
      className={`relative ${aspectClass} w-full overflow-hidden bg-muted/20`}
    >
      <Image
        src={src!}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isDataOrBlob}
        onError={() => setHasError(true)}
        className={className}
      />
    </div>
  );
}

export default BlogCoverImage;
