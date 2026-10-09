"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative py-10 sm:py-16 lg:py-20">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14">
          {/* Column: Big Hero Image of Prof. Surajit Borkotokey */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="relative mx-auto w-full max-w-[280px] sm:max-w-sm lg:max-w-none">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border/80 bg-muted/20 shadow-md">
                <Image
                  src="/images/surajit-borkotokey.jpg"
                  alt="Prof. Surajit Borkotokey - Professor of Mathematics, Dibrugarh University"
                  fill
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 380px, 480px"
                  className="object-cover object-top transition-transform duration-500 hover:scale-[1.01]"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Column: Academic Persona & Bio */}
          <div className="space-y-5 sm:space-y-6 lg:col-span-6 order-2 lg:order-1 text-left">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                <span>Dibrugarh University &bull; Assam, India</span>
              </div>

              <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.12]">
                Prof. Surajit Borkotokey
              </h1>

              <p className="text-sm sm:text-lg font-medium text-foreground/85 font-heading">
                Professor of Mathematics &bull; Cooperative Game Theorist
              </p>
            </div>

            <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
              Specializing in applied mathematics, cooperative game theory, network games, fuzzy sets, and aggregation operators. Connecting foundational mathematical theory with applications in networks, multicriteria decision making, social choice, and biological/communication networks.
            </p>

            {/* Senior Roles & Fellowships Summary */}
            <div className="space-y-2 pt-2 border-t border-border/40 text-xs text-muted-foreground font-mono">
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 shrink-0 mt-1.5" />
                <span>Senior Visiting Research Fellow, CIAS Budapest (2025–Present)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 shrink-0 mt-1.5" />
                <span>Former Dean of Student Affairs &bull; Director, Office of International Affairs</span>
              </div>
            </div>

            {/* Quick jump anchor links - Touch-friendly pills */}
            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
              <a
                href="#research"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/70 bg-muted/40 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/70 active:scale-95"
              >
                <span>Research</span>
                <ArrowDown className="h-3 w-3" />
              </a>
              <a
                href="#fellowships"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/70 bg-muted/40 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/70 active:scale-95"
              >
                <span>Fellowships</span>
                <ArrowDown className="h-3 w-3" />
              </a>
              <Link
                href="/blog"
                prefetch={true}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/70 bg-muted/40 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/70 active:scale-95"
              >
                <span>Blogs</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/70 bg-muted/40 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/70 active:scale-95"
              >
                <span>Contact</span>
                <ArrowDown className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
