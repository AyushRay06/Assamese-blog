"use client";

import * as React from "react";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative py-12 sm:py-20 lg:py-24">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Column: Academic Persona & Bio */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-7 order-2 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="space-y-3 w-full">
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.12]">
                Prof. Surajit Borkotokey
              </h1>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl font-medium text-foreground/85 font-heading">
                <span className="text-foreground">Professor of Mathematics</span>
                <span className="text-muted-foreground/40">&bull;</span>
                <span className="text-foreground/80">Cooperative Game Theory</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/70 bg-muted/40 text-[11px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
              <span>Dibrugarh University, Assam, India</span>
            </div>
          </div>

          {/* Column: Hero Image of Prof. Surajit Borkotokey */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
            <div className="relative mx-auto w-full max-w-[280px] sm:max-w-sm lg:max-w-[360px]">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border/80 bg-muted/20 shadow-md">
                <Image
                  src="/images/surajit-borkotokey.jpg"
                  alt="Prof. Surajit Borkotokey - Professor of Mathematics, Dibrugarh University"
                  fill
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 360px, 420px"
                  className="object-cover object-top transition-transform duration-500 hover:scale-[1.01]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

