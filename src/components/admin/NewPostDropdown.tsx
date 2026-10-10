"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, PenTool, UploadCloud, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

interface NewPostDropdownProps {
  className?: string;
}

export function NewPostDropdown({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className={cn("inline-flex items-center", className)}>
      <DropdownMenu>
        <div className="inline-flex items-center rounded-full bg-primary p-0.5 text-primary-foreground shadow-xs hover:shadow-md transition-all">
          <Link
            href="/admin/posts/new?mode=editor"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Post</span>
          </Link>
          <div className="h-4 w-px bg-primary-foreground/25" />
          <DropdownMenuTrigger
            className="p-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 rounded-full transition-colors cursor-pointer outline-none"
            aria-label="New post options"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
        </div>

        <DropdownMenuContent
          align="end"
          className="w-64 p-2 rounded-2xl shadow-xl border-border/40 backdrop-blur-md bg-background/95"
        >
          <DropdownMenuItem
            onClick={() => router.push("/admin/posts/new?mode=editor")}
            className="flex items-start gap-3 p-2.5 cursor-pointer rounded-xl hover:bg-muted/60 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
              <PenTool className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">Bilingual Studio</span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                  SMS
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Write with English &amp; Assamese phonetic typing.
              </p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1.5 bg-border/40" />

          <DropdownMenuItem
            onClick={() => router.push("/admin/posts/new?mode=import")}
            className="flex items-start gap-3 p-2.5 cursor-pointer rounded-xl hover:bg-muted/60 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 mt-0.5">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">Ready-Made Blog</span>
                <span className="text-[10px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-full font-medium">
                  Import
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Upload Markdown/Word file with instant cover photo.
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
