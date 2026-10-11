import Link from "next/link";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { cn } from "cn";

interface AdminHeaderProps {
  unreadMessagesCount?: number;
  activeTab?: "posts" | "messages";
}

export function AdminHeader({}: AdminHeaderProps = {}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-8 lg:px-12">
        {/* Admin Logo & Word */}
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

        {/* Right Actions: Live Site link & Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-full px-3 inline-flex border border-border/40 hover:bg-muted/50"
            )}
            title="Open live website in new tab"
          >
            <span>Live Site</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          <div className="h-4 w-px bg-border/40 mx-0.5" />
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
