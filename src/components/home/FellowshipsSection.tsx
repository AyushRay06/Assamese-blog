"use client";

import * as React from "react";
import { Cabinet } from "@lucasmarkes/hairline/react";
import { Globe, Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Fellowship {
  institution: string;
  location: string;
  role: string;
  period?: string;
  active?: boolean;
}

const FELLOWSHIPS: Fellowship[] = [
  {
    institution: "Corvinus Institute for Advanced Studies (CIAS)",
    location: "Budapest, Hungary",
    role: "Senior Visiting Research Fellow",
    period: "2025 – Present",
    active: true,
  },
  {
    institution: "Queen's University Belfast",
    location: "Belfast, United Kingdom",
    role: "Visiting Research Fellow",
  },
  {
    institution: "Slovak University of Technology",
    location: "Bratislava, Slovakia",
    role: "Visiting Research Fellow",
  },
  {
    institution: "Beijing Institute of Technology",
    location: "Beijing, China",
    role: "Visiting Research Fellow",
  },
  {
    institution: "Louisiana State University",
    location: "Baton Rouge, USA",
    role: "Visiting Research Fellow",
  },
];

export function FellowshipsSection() {
  return (
    <section id="fellowships" className="relative py-16 sm:py-24">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3 mb-12 sm:mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Academic Engagements &bull; Global Appointments
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Fellowships &amp; Institutional Leadership
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            International visiting research fellowships alongside senior teaching, administrative, and international-engagement responsibilities.
          </p>
        </div>

        {/* 2-Column Grid: Cabinet Figure on Left, Fellowships List on Right */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Cabinet Figure (Free-standing, pure figure) */}
          <div className="flex flex-col items-center lg:items-start lg:col-span-5 order-2 lg:order-1 pt-4 lg:pt-0">
            <div className="w-full max-w-[280px] sm:max-w-[340px]">
              <div className="relative aspect-[5/4] w-full select-none cursor-pointer">
                <Cabinet
                  intensity={0.7}
                  play={true}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Fellowships & Governance Info */}
          <div className="space-y-8 lg:col-span-7 order-1 lg:order-2">
            {/* International Visiting Appointments */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                <span>Visiting Research Fellowships</span>
              </div>

              <div className="divide-y divide-border/40">
                {FELLOWSHIPS.map((f, i) => (
                  <div
                    key={i}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5 sm:gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {f.active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                        )}
                        <h3 className="text-sm font-semibold text-foreground">
                          {f.institution}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{f.location}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono text-xs mt-1 sm:mt-0">
                      <span className={cn(
                        "inline-block rounded px-2 py-0.5 text-[11px]",
                        f.active ? "bg-foreground text-background font-semibold" : "bg-muted text-muted-foreground"
                      )}>
                        {f.role}
                      </span>
                      {f.period && (
                        <span className="block text-[11px] text-muted-foreground/80 mt-0.5 sm:mt-0">
                          {f.period}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* University Governance & Administrative Roles */}
            <div className="border-t border-border/40 pt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>Administrative Leadership &bull; Dibrugarh University</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-1 shadow-2xs">
                  <span className="text-sm font-medium text-foreground block">
                    Dean of Student Affairs
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed block">
                    Senior Administrative &amp; Student Affairs Leadership
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-1 shadow-2xs">
                  <span className="text-sm font-medium text-foreground block">
                    Director, Office of International Affairs
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed block">
                    International Engagement, Global MOUs &amp; Research Linkages
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FellowshipsSection;
