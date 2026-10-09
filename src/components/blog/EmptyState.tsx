"use client";

import { Plot } from "@lucasmarkes/hairline/react";

interface EmptyStateProps {
  activeLang?: string;
}

export function EmptyState({ activeLang }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-6 h-28 w-36 sm:h-32 sm:w-44 select-none">
        <Plot intensity={0.6} play={true} className="h-full w-full" />
      </div>
      <h3 className="font-heading text-lg sm:text-xl font-semibold text-foreground">
        No essays published yet
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
        {activeLang
          ? `There are currently no published essays in this language filter.`
          : "New mathematical reflections and bilingual essays will be published here soon."}
      </p>
    </div>
  );
}

export default EmptyState;
