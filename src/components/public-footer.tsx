import Link from "next/link";
import { Rss } from "lucide-react";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-muted/30 py-10 transition-colors">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="space-y-1">
            <p className="font-medium text-sm text-foreground">
              Bilingual Notebook
            </p>
            <p className="text-xs text-muted-foreground">
              A personal publishing archive in English and Assamese (অসমীয়া).
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link
              href="/rss.xml"
              target="_blank"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Rss className="h-3 w-3" />
              <span>RSS Feed</span>
            </Link>
            <span>&copy; {currentYear} All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
