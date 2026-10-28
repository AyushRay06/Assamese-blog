"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "cn";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/" || pathname === "";
  const isBlog = pathname?.startsWith("/blog");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/90 backdrop-blur-md transition-colors">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Academic Persona */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-85"
        >
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border shadow-xs">
            <Image
              src="/images/surajit-borkotokey-hero.jpg"
              alt="Prof. Surajit Borkotokey"
              fill
              sizes="32px"
              className="object-cover object-center"
              priority
            />
          </div>
          <span className="font-heading text-sm sm:text-base font-semibold tracking-tight text-foreground">
            Home
          </span>
        </Link>

        {/* Right side navigation & 1-click Blogs access */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono">
            <Link
              href="/#research"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Research
            </Link>
            <Link
              href="/#fellowships"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Fellowships
            </Link>
            <Link
              href="/#contact"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </nav>

          {/* 1-Click Blogs Menu Button: Instant access on both Mobile and Desktop */}
          <Link
            href="/blog"
            prefetch={true}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all active:scale-95 shadow-2xs",
              isBlog
                ? "bg-foreground text-background font-semibold"
                : "border border-border/80 bg-foreground text-background hover:bg-foreground/90"
            )}
            aria-label="Navigate to Blogs page"
          >
            <span>Blogs</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-foreground md:hidden active:scale-95 transition-all"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border/60 bg-background/98 backdrop-blur-xl px-4 py-4 md:hidden shadow-lg animate-in fade-in-50 slide-in-from-top-1 duration-150">
          <nav className="flex flex-col space-y-1 text-sm font-mono">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
                isHome
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span>Home</span>
              <span className="text-xs text-muted-foreground/60">01</span>
            </Link>
            <Link
              href="/#research"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <span>Research</span>
              <span className="text-xs text-muted-foreground/60">02</span>
            </Link>
            <Link
              href="/#fellowships"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <span>Fellowships</span>
              <span className="text-xs text-muted-foreground/60">03</span>
            </Link>
            <Link
              href="/blog"
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
                isBlog
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span>Blogs</span>
              <span className={cn(
                "text-[10px] uppercase font-sans font-medium px-1.5 py-0.5 rounded",
                isBlog ? "bg-background/20 text-background" : "bg-primary/10 text-primary"
              )}>
                Bilingual
              </span>
            </Link>
            <Link
              href="/#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <span>Contact</span>
              <span className="text-xs text-muted-foreground/60">04</span>
            </Link>
          </nav>

          <div className="mt-3 pt-3 border-t border-border/40 px-3 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>Dibrugarh University</span>
            <span>Assam, India</span>
          </div>
        </div>
      )}
    </header>
  );
}

export default PublicHeader;
