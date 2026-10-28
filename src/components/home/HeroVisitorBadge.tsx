"use client";

import * as React from "react";
import { Users, Eye } from "lucide-react";
import { cn } from "cn";

interface HeroVisitorBadgeProps {
  initialCount?: number;
  className?: string;
}

export function HeroVisitorBadge({
  initialCount = 1840,
  className,
}: HeroVisitorBadgeProps) {
  const [count, setCount] = React.useState<number>(initialCount);

  // Periodically refresh visitor count
  React.useEffect(() => {
    let isMounted = true;
    async function refreshCount() {
      try {
        const res = await fetch("/api/visitor-count");
        if (res.ok) {
          const data = await res.json();
          const total = data.count ?? data.totalCount;
          if (isMounted && typeof total === "number" && total > 0) {
            setCount(total);
          }
        }
      } catch {
        // Fallback silently
      }
    }

    const interval = setInterval(refreshCount, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/70 bg-card/80 backdrop-blur-xs shadow-2xs text-xs font-mono text-muted-foreground transition-all hover:border-border hover:text-foreground select-none",
        className
      )}
      title="Verified reader & academic visits to this archive"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="font-semibold text-foreground tracking-tight">
        {count.toLocaleString()}
      </span>
      <span className="text-[11px] text-muted-foreground/80">
        readers &amp; visitors
      </span>
    </div>
  );
}

export default HeroVisitorBadge;
