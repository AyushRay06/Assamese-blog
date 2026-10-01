import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Rss, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold text-lg tracking-tight transition-colors hover:text-primary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="font-heading font-bold text-foreground">
            Bilingual Notebook
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RSS Feed"
            title="RSS Feed"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            )}
          >
            <Rss className="h-4 w-4" />
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
