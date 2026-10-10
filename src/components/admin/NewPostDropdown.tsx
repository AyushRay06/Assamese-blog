"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, PenTool, UploadCloud, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
  size?: "default" | "sm";
}

export function NewPostDropdown({ className, size = "default" }: NewPostDropdownProps) {
  const router = useRouter();

  return (
    <div className={cn("inline-flex items-center shadow-xs", className)}>
      <Link
        href="/admin/posts/new?mode=editor"
        className={cn(
          buttonVariants({ size }),
          "gap-2 rounded-none border-r border-primary-foreground/20 font-medium"
        )}
      >
        <Plus className="h-4 w-4" />
        <span>New Post</span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ size }),
            "px-2 rounded-none cursor-pointer focus-visible:outline-none"
          )}
          aria-label="New post creation options"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-1.5 shadow-lg">
          <DropdownMenuItem
            onClick={() => router.push("/admin/posts/new?mode=editor")}
            className="flex items-start gap-3 p-2.5 cursor-pointer rounded-none hover:bg-muted/70 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary/10 text-primary mt-0.5">
              <PenTool className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">Bilingual Studio</span>
                <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1 py-0.2 font-semibold">
                  SMS Typing
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Distraction-free editor with English and Assamese (অসমীয়া) keyboard.
              </p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            onClick={() => router.push("/admin/posts/new?mode=import")}
            className="flex items-start gap-3 p-2.5 cursor-pointer rounded-none hover:bg-muted/70 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-sky-500/10 text-sky-600 dark:text-sky-400 mt-0.5">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">Ready-Made Blog</span>
                <span className="text-[9px] font-mono bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 px-1 py-0.2 font-semibold">
                  Importer
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Upload or paste a prepared Word/Markdown file with instant cover image.
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
