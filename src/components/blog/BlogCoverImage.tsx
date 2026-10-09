"use client";

import { useState } from "react";
import Image from "next/image";

interface BlogCoverImageProps {
  src: string | null | undefined;
  alt: string;
  isAssamese?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  aspectClass?: string;
}

export function BlogCoverImage({
  src,
  alt,
  isAssamese = false,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  className = "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]",
  aspectClass = "aspect-[16/10]",
}: BlogCoverImageProps) {
  const [hasError, setHasError] = useState(false);

  const shouldShowImage = Boolean(src && src.trim() && !hasError);

  if (!shouldShowImage) {
    return (
      <div className={`relative ${aspectClass} w-full overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-muted/40 via-muted/20 to-muted/10 flex items-center justify-center select-none`}>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
          {isAssamese ? "অসমীয়া নিবন্ধ" : "Essay"}
        </span>
      </div>
    );
  }

  const isDataOrBlob = Boolean(
    src?.startsWith("data:") || src?.startsWith("blob:")
  );

  return (
    <div className={`relative ${aspectClass} w-full overflow-hidden rounded-xl border border-border/70 bg-muted/20 transition-all duration-300 group-hover:border-foreground/40 group-hover:shadow-sm`}>
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
