import Link from "next/link";
import { ShieldCheck, Plus, ArrowUpRight, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { cn } from "cn";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-none border border-primary/30 bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-heading">Admin Dashboard</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/admin"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Posts</span>
            </Link>
            <Link
              href="/admin/posts/new"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5"
              )}
            >
              <Plus className="h-4 w-4" />
              <span>New Post</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            )}
          >
            <span>View Public Site</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <div className="h-4 w-px bg-border/60 mx-0.5 hidden sm:block" />
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}
