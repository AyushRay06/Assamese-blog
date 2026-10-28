"use client";

import * as React from "react";

interface FooterVisitorBadgeProps {
  initialCount?: number;
}

export function FooterVisitorBadge({ initialCount }: FooterVisitorBadgeProps) {
  const [count, setCount] = React.useState<number | null>(
    typeof initialCount === "number" && initialCount > 0 ? initialCount : null
  );

  React.useEffect(() => {
    let isMounted = true;
    async function loadCount() {
      try {
        const res = await fetch("/api/visitor-count");
        if (res.ok) {
          const data = await res.json();
          const total = data.count ?? data.totalCount;
          if (isMounted && typeof total === "number") {
            setCount(total);
          }
        }
      } catch {
        // Fallback silently
      }
    }

    if (count === null) {
      loadCount();
    }

    const interval = setInterval(loadCount, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [count]);

  if (count === null) {
    return null;
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border/60 bg-muted/30 text-[11px] font-mono text-muted-foreground select-none"
      title="Verified site visits"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span>{count.toLocaleString()} visits</span>
    </div>
  );
}

export default FooterVisitorBadge;
