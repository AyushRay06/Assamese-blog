"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "cn";

interface LanguageFilterProps {
  currentLang?: string;
  basePath?: string;
  totalCounts?: {
    all: number;
    en: number;
    as: number;
  };
}

export function LanguageFilter({ currentLang, basePath = "/blog", totalCounts }: LanguageFilterProps) {
  const searchParams = useSearchParams();
  const active = (searchParams.get("lang") || currentLang || "ALL").toUpperCase();

  const filters = [
    {
      key: "ALL",
      href: basePath,
      label: "All",
      count: totalCounts?.all,
    },
    {
      key: "EN",
      href: `${basePath}?lang=en`,
      label: "English",
      count: totalCounts?.en,
    },
    {
      key: "AS",
      href: `${basePath}?lang=as`,
      label: "অসমীয়া",
      count: totalCounts?.as,
    },
  ];

  return (
    <div className="flex items-center gap-2 p-1 rounded-full bg-muted/30 border border-border/60">
      {filters.map((filter) => {
        const isActive =
          filter.key === "ALL"
            ? active === "ALL" || !["EN", "AS"].includes(active)
            : active === filter.key;

        return (
          <Link
            key={filter.key}
            href={filter.href}
            prefetch={true}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all",
              isActive
                ? "bg-foreground text-background font-medium shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{filter.label}</span>
            {filter.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  isActive
                    ? "text-background/80"
                    : "text-muted-foreground/70"
                )}
              >
                {filter.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default LanguageFilter;
