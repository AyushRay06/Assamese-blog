"use client";

import * as React from "react";
import { Cabinet, Drawer, Riffle } from "@lucasmarkes/hairline/react";
import BookshelfFigure from "@/components/hairline/BookshelfFigure";
import { cn } from "cn";

interface FigureItem {
  id: "bookshelf" | "drawer" | "cabinet" | "riffle";
  label: string;
  desc: string;
  component: React.ComponentType<{
    intensity?: number;
    play?: boolean;
    onRead?: (text: string) => void;
    className?: string;
  }>;
}

const FIGURES: FigureItem[] = [
  {
    id: "bookshelf",
    label: "Bookshelf",
    desc: "Library volumes & statues",
    component: BookshelfFigure,
  },
  {
    id: "drawer",
    label: "Drawer",
    desc: "Three-tier archive drawer",
    component: Drawer,
  },
  {
    id: "cabinet",
    label: "Cabinet",
    desc: "Filing rack & archive blades",
    component: Cabinet,
  },
  {
    id: "riffle",
    label: "Riffle",
    desc: "Index catalog & card tray",
    component: Riffle,
  },
];

export function ProfessorProfile() {
  const [activeId, setActiveId] = React.useState<FigureItem["id"]>("bookshelf");
  const [caption, setCaption] = React.useState<string>("");

  const activeFigure = FIGURES.find((f) => f.id === activeId) || FIGURES[0];
  const ActiveComponent = activeFigure.component;

  return (
    <section className="relative overflow-hidden border-b border-border/40 py-12 sm:py-20 lg:py-24">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Minimal Academic Identity */}
          <div className="space-y-6 lg:col-span-7">
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Faculty of Mathematics &bull; Dibrugarh University
              </div>
              <h1 className="font-heading text-3xl sm:text-5xl lg:text-5xl font-semibold tracking-tight text-foreground">
                Prof. Surajit Borkotokey
              </h1>
            </div>

            <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
              Applied mathematics, cooperative game theory, and networks. Writing bilingual essays, mathematical notes, and reflections across English and Assamese.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CIAS Fellow, Budapest
              </span>
              <span>&bull;</span>
              <span>Assam, India</span>
              <span>&bull;</span>
              <span>Bilingual Archive</span>
            </div>
          </div>

          {/* Right Column: Free-Standing Hairline Figure (No Box / No Border) */}
          <div className="flex flex-col items-center lg:items-end lg:col-span-5">
            {/* Figure Display - standing directly on page without any square box or border */}
            <div className="w-full max-w-[340px] sm:max-w-[380px]">
              {/* Ultra-minimal text switcher */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
                  {FIGURES.map((fig) => {
                    const isActive = fig.id === activeId;
                    return (
                      <button
                        key={fig.id}
                        type="button"
                        onClick={() => {
                          setActiveId(fig.id);
                          setCaption("");
                        }}
                        className={cn(
                          "transition-colors pb-0.5",
                          isActive
                            ? "text-foreground font-semibold border-b border-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {fig.label}
                      </button>
                    );
                  })}
                </div>

                <span className="text-[10px] font-mono text-muted-foreground/70 hidden sm:inline">
                  live figure
                </span>
              </div>

              {/* The Figure rendered AS IS - with zero borders, zero background card, zero box */}
              <div className="relative aspect-[5/4] w-full select-none cursor-pointer">
                <ActiveComponent
                  key={activeId}
                  intensity={0.7}
                  play={true}
                  onRead={(text) => setCaption(text)}
                  className="w-full h-full"
                />
              </div>

              {/* Quiet caption underneath */}
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground/70 px-0.5">
                <span className="truncate">{caption || activeFigure.desc}</span>
                <span className="text-[10px] opacity-60 shrink-0 ml-2">hover to interact</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default ProfessorProfile;
