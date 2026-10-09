import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  lang?: string;
  basePath?: string;
}

export function Pagination({ currentPage, totalPages, lang, basePath = "/blog" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    if (lang && lang !== "ALL") params.set("lang", lang.toLowerCase());
    if (page > 1) params.set("page", page.toString());
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className="mt-12 flex items-center justify-center gap-3 border-t border-border/40 pt-8"
    >
      <Link
        href={buildUrl(currentPage - 1)}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          currentPage <= 1 && "pointer-events-none opacity-50"
        )}
        aria-disabled={currentPage <= 1}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Previous
      </Link>

      <span className="text-sm font-medium text-muted-foreground px-2">
        Page <span className="text-foreground font-semibold">{currentPage}</span> of{" "}
        <span className="text-foreground font-semibold">{totalPages}</span>
      </span>

      <Link
        href={buildUrl(currentPage + 1)}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          currentPage >= totalPages && "pointer-events-none opacity-50"
        )}
        aria-disabled={currentPage >= totalPages}
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Link>
    </nav>
  );
}
