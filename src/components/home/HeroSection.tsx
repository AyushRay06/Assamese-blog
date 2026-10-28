"use client";

import * as React from "react";
import Image from "next/image";
import { HeroBlogMarquee, type MarqueePost } from "./HeroBlogMarquee";

interface HeroSectionProps {
  posts?: MarqueePost[];
}

export function HeroSection({ posts }: HeroSectionProps) {
  return (
    <section className="relative py-8 sm:py-14 lg:py-16">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Column: Academic Persona & Bio */}
          <div className="space-y-3 sm:space-y-4 lg:col-span-7 order-2 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="space-y-2 sm:space-y-2.5 w-full">
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-semibold tracking-tight text-foreground leading-[1.18]">
                Prof. Surajit Borkotokey
              </h1>

              {/* Academic Credentials & Leadership Stack */}
              <div className="space-y-1 text-center lg:text-left max-w-lg text-xs sm:text-[13px]">
                <p className="font-semibold text-foreground text-sm sm:text-[15px]">
                  Professor of Mathematics
                </p>
                <p className="font-medium text-foreground/85">
                  Dean Student Affairs &bull; Director, Office of International Affairs
                </p>
                <p className="text-muted-foreground leading-snug">
                  Former Senior Visiting Research Fellow at CIAS, Corvinus University, Budapest
                </p>
                <p className="text-muted-foreground leading-snug">
                  Former Indo-US Fellow at Louisiana State University, USA
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/70 bg-muted/40 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
              <span>Dibrugarh University, Assam, India</span>
            </div>

            {/* Blogs Marquee placed directly under the university badge */}
            <HeroBlogMarquee posts={posts} />
          </div>

          {/* Column: Hero Image of Prof. Surajit Borkotokey & Live Visitor Counter */}
          {/* Column: Hero Image of Prof. Surajit Borkotokey */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
            <div className="relative aspect-square w-48 sm:w-56 lg:w-64 overflow-hidden rounded-full border-2 border-border/80 bg-muted/20 shadow-lg ring-4 ring-muted/30 transition-transform duration-300 hover:scale-[1.02]">
              <Image
                src="/images/surajit-borkotokey.jpg"
                alt="Prof. Surajit Borkotokey - Professor of Mathematics, Dibrugarh University"
                fill
                sizes="(max-width: 640px) 192px, (max-width: 1024px) 224px, 256px"
                className="object-cover object-top transition-transform duration-500 hover:scale-105"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
