import Link from "next/link";
import { ShieldCheck, Plus, ArrowUpRight, FileText, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { cn } from "cn";

interface AdminHeaderProps {
  unreadMessagesCount?: number;
  activeTab?: "posts" | "messages";
}

export function AdminHeader({
  unreadMessagesCount = 0,
  activeTab = "posts",
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 font-bold text-base tracking-tight transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-heading font-semibold text-foreground">
              Admin
            </span>
          </Link>

          <nav className="flex items-center gap-1.5 text-sm">
            <Link
              href="/admin?tab=posts"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeTab === "posts"
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Articles</span>
            </Link>

            <Link
              href="/admin?tab=messages"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors relative",
                activeTab === "messages"
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Inquiries</span>
              {unreadMessagesCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-mono font-bold text-primary-foreground leading-none">
                  {unreadMessagesCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin/posts/new"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 text-xs font-medium rounded-full px-3.5 hidden sm:inline-flex border-border/50"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Post</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 text-xs text-muted-foreground hover:text-foreground rounded-full px-3 hidden md:inline-flex"
            )}
            title="Open live website in new tab"
          >
            <span>Live Site</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          <div className="h-4 w-px bg-border/40 mx-0.5 hidden sm:block" />
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}
