"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface LanguageFilterProps {
  currentLang?: string;
  totalCounts?: {
    all: number;
    en: number;
    as: number;
  };
}

export function LanguageFilter({ currentLang, totalCounts }: LanguageFilterProps) {
  const searchParams = useSearchParams();
  const active = (searchParams.get("lang") || currentLang || "ALL").toUpperCase();

  const filters = [
    {
      key: "ALL",
      href: "/",
      label: "All Posts",
      nativeLabel: "সকলো",
      count: totalCounts?.all,
    },
    {
      key: "EN",
      href: "/?lang=en",
      label: "English",
      nativeLabel: "English",
      count: totalCounts?.en,
    },
    {
      key: "AS",
      href: "/?lang=as",
      label: "Assamese",
      nativeLabel: "অসমীয়া",
      count: totalCounts?.as,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mr-2">
        Language:
      </span>
      <div className="inline-flex items-center rounded-lg bg-muted/60 p-1 text-muted-foreground">
        {filters.map((filter) => {
          const isActive =
            filter.key === "ALL"
              ? active === "ALL" || !["EN", "AS"].includes(active)
              : active === filter.key;

          return (
            <Link
              key={filter.key}
              href={filter.href}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <span>{filter.label}</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                ({filter.nativeLabel})
              </span>
              {filter.count !== undefined && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-0.5 h-4 px-1 text-[10px] font-normal"
                >
                  {filter.count}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
