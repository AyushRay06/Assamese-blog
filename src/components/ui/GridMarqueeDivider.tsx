"use client";

import * as React from "react";
import { cn } from "cn";

interface GridMarqueeDividerProps {
  className?: string;
  reverse?: boolean;
}

export function GridMarqueeDivider({ className, reverse = false }: GridMarqueeDividerProps) {
  // Architectural straight-line grid pattern using SVG
  const renderGridStrip = () => (
    <div className="flex shrink-0 items-center">
      <svg
        width="960"
        height="32"
        viewBox="0 0 960 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block stroke-border/70"
        strokeWidth="0.8"
      >
        {/* Horizontal boundary and center guide lines */}
        <line x1="0" y1="8" x2="960" y2="8" strokeDasharray="3 3" />
        <line x1="0" y1="16" x2="960" y2="16" />
        <line x1="0" y1="24" x2="960" y2="24" strokeDasharray="3 3" />

        {/* Vertical parallel straight lines spaced every 12px */}
        {Array.from({ length: 80 }).map((_, i) => {
          const x = i * 12;
          const isMajor = i % 4 === 0;
          return (
            <React.Fragment key={i}>
              <line
                x1={x}
                y1="0"
                x2={x}
                y2="32"
                strokeWidth={isMajor ? "1" : "0.6"}
                strokeOpacity={isMajor ? "0.9" : "0.45"}
              />
              {/* 45-degree diagonal cross-hatch straight lines at major intervals */}
              {isMajor && (
                <>
                  <line
                    x1={x}
                    y1="4"
                    x2={x + 24}
                    y2="28"
                    strokeWidth="0.6"
                    strokeOpacity="0.4"
                  />
                  <line
                    x1={x + 24}
                    y1="4"
                    x2={x}
                    y2="28"
                    strokeWidth="0.6"
                    strokeOpacity="0.4"
                  />
                </>
              )}
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative w-full border-y border-border/40 bg-background overflow-hidden select-none pointer-events-none py-1",
        className
      )}
    >
      <div
        className={cn(
          "flex w-max",
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        )}
      >
        {renderGridStrip()}
        {renderGridStrip()}
        {renderGridStrip()}
      </div>
    </div>
  );
}

export default GridMarqueeDivider;
