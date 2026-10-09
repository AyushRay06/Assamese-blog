"use client";

import * as React from "react";
import { Drawer } from "@lucasmarkes/hairline/react";

interface Specialization {
  title: string;
  description: string;
}

const SPECIALIZATIONS: Specialization[] = [
  {
    title: "Applied Mathematics",
    description: "Mathematical modeling and quantitative methodologies connecting abstract structures with concrete analytical problems.",
  },
  {
    title: "Cooperative Game Theory",
    description: "Coalitional structures, characteristic function games, core solutions, and fair value allocations.",
  },
  {
    title: "Network Games & Network Analysis",
    description: "Strategic interactions over complex graphs, network centrality metrics, and structural connectivity.",
  },
  {
    title: "Fuzzy Sets & Fuzzy Cooperative Games",
    description: "Decision-making and coalition formation under uncertainty, fuzzy coalitional worths, and generalized values.",
  },
  {
    title: "Aggregation Operators & Choquet Integrals",
    description: "Non-additive measures, criteria interactions, and non-linear mathematical aggregation frameworks.",
  },
  {
    title: "Multicriteria Decision Making (MCDM)",
    description: "Evaluation frameworks, axiomatic preference modeling, and ranking systems under multiple conflicting criteria.",
  },
  {
    title: "Biological & Communication Networks",
    description: "Game-theoretic applications in biological systems, metabolic networks, and communication routing protocols.",
  },
];

export function ResearchSection() {
  return (
    <section id="research" className="relative py-16 sm:py-24">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3 mb-12 sm:mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Areas of Specialization &bull; Research
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Research &amp; Mathematical Focus
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Connecting mathematical theory with applications in networks, multicriteria decision making, social choice, and biological/communication networks.
          </p>
        </div>

        {/* 2-Column Grid: Specialization list on Left, Drawer Figure on Right */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: 7 Areas of Specialization */}
          <div className="space-y-6 lg:col-span-7">
            <div className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2">
              {SPECIALIZATIONS.map((spec, i) => (
                <div
                  key={i}
                  className="group p-4 sm:p-4.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs transition-all hover:border-foreground/30 hover:bg-card shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded select-none font-semibold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-heading text-sm sm:text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {spec.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-0.5">
                    {spec.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Drawer Figure (Free-standing, pure figure) */}
          <div className="flex flex-col items-center lg:items-end lg:col-span-5 pt-4 lg:pt-0">
            <div className="w-full max-w-[280px] sm:max-w-[340px]">
              <div className="relative aspect-[5/4] w-full select-none cursor-pointer">
                <Drawer
                  intensity={0.7}
                  play={true}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResearchSection;
