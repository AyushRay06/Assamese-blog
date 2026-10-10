import { getAllPostsAdmin } from "@/lib/posts";
import prisma from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostsTable } from "@/components/admin/PostsTable";
import { ContactMessagesTable } from "@/components/admin/ContactMessagesTable";
import { NewPostDropdown } from "@/components/admin/NewPostDropdown";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileText,
  CheckCircle2,
  FileEdit,
  Globe2,
  Mail,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

interface AdminDashboardProps {
  searchParams: Promise<{
    search?: string;
    status?: "DRAFT" | "PUBLISHED";
    language?: "EN" | "AS";
    tab?: "posts" | "messages";
  }>;
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  const params = await searchParams;
  const activeTab = params.tab === "messages" ? "messages" : "posts";

  let posts: any[] = [];
  let contactMessages: any[] = [];
  let totalPostsCount = 0;
  let publishedCount = 0;
  let draftCount = 0;
  let assameseCount = 0;
  let englishCount = 0;
  let unreadMessagesCount = 0;
  let totalMessagesCount = 0;

  if (process.env.DATABASE_URL) {
    try {
      const [
        totalPosts,
        published,
        drafts,
        assamese,
        english,
        unreadMsgs,
        totalMsgs,
        fetchedPosts,
        fetchedMessages,
      ] = await Promise.all([
        prisma.post.count(),
        prisma.post.count({ where: { status: "PUBLISHED" } }),
        prisma.post.count({ where: { status: "DRAFT" } }),
        prisma.post.count({ where: { language: "AS" } }),
        prisma.post.count({ where: { language: "EN" } }),
        prisma.contactMessage.count({ where: { status: "UNREAD" } }),
        prisma.contactMessage.count(),
        getAllPostsAdmin({
          search: params.search,
          status: params.status,
          language: params.language,
        }),
        activeTab === "messages" || true
          ? prisma.contactMessage.findMany({
              orderBy: { createdAt: "desc" },
              take: 50,
            })
          : [],
      ]);

      totalPostsCount = totalPosts;
      publishedCount = published;
      draftCount = drafts;
      assameseCount = assamese;
      englishCount = english;
      unreadMessagesCount = unreadMsgs;
      totalMessagesCount = totalMsgs;
      posts = fetchedPosts;
      contactMessages = fetchedMessages;
    } catch (err) {
      console.warn("Admin dashboard database error:", err);
    }
  }

  const hasActiveFilters = Boolean(params.search || params.status || params.language);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader
        unreadMessagesCount={unreadMessagesCount}
        activeTab={activeTab}
      />

      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
          {/* Header Area */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
                  Dashboard
                </span>
                <span className="text-muted-foreground/60">•</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Borkotoki Portal
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-0.5">
                Editorial &amp; Academic Admin
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Manage your bilingual publications, review drafts, and respond to incoming inquiries.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <NewPostDropdown />
            </div>
          </div>

          {/* Unified Executive Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Total Articles */}
            <Link
              href="/admin?tab=posts"
              className={cn(
                "group relative p-4 border bg-card/60 transition-all hover:bg-card hover:border-primary/50 shadow-xs",
                activeTab === "posts" && !params.status && !params.language
                  ? "border-primary bg-primary/[0.03] ring-1 ring-primary/30"
                  : "border-border/80"
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium tracking-tight">All Articles</span>
                <FileText className="h-4 w-4 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-2xl font-bold font-heading text-foreground">
                {totalPostsCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Full catalog archive</p>
            </Link>

            {/* Published */}
            <Link
              href="/admin?tab=posts&status=PUBLISHED"
              className={cn(
                "group relative p-4 border bg-card/60 transition-all hover:bg-card hover:border-emerald-500/50 shadow-xs",
                params.status === "PUBLISHED"
                  ? "border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30"
                  : "border-border/80"
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium tracking-tight flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  Published
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
                {publishedCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Live on website</p>
            </Link>

            {/* Drafts */}
            <Link
              href="/admin?tab=posts&status=DRAFT"
              className={cn(
                "group relative p-4 border bg-card/60 transition-all hover:bg-card hover:border-amber-500/50 shadow-xs",
                params.status === "DRAFT"
                  ? "border-amber-500 bg-amber-500/[0.04] ring-1 ring-amber-500/30"
                  : "border-border/80"
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium tracking-tight flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                  Drafts
                </span>
                <FileEdit className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400">
                {draftCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Work in progress</p>
            </Link>

            {/* Assamese */}
            <Link
              href="/admin?tab=posts&language=AS"
              className={cn(
                "group relative p-4 border bg-card/60 transition-all hover:bg-card hover:border-primary/50 shadow-xs",
                params.language === "AS"
                  ? "border-primary bg-primary/[0.04] ring-1 ring-primary/30"
                  : "border-border/80"
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium tracking-tight">অসমীয়া (Assamese)</span>
                <Globe2 className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold font-heading text-primary">
                {assameseCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Regional literature</p>
            </Link>

            {/* Contact Inquiries */}
            <Link
              href="/admin?tab=messages"
              className={cn(
                "group relative p-4 border bg-card/60 transition-all hover:bg-card hover:border-primary/50 shadow-xs col-span-2 md:col-span-1",
                activeTab === "messages"
                  ? "border-primary bg-primary/[0.04] ring-1 ring-primary/30"
                  : unreadMessagesCount > 0
                  ? "border-primary/50 bg-primary/[0.02]"
                  : "border-border/80"
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium tracking-tight flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Inquiries
                </span>
                {unreadMessagesCount > 0 ? (
                  <span className="text-[10px] font-mono font-bold bg-primary text-primary-foreground px-1.5 py-0.2">
                    {unreadMessagesCount} unread
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-muted-foreground">0 new</span>
                )}
              </div>
              <div className="text-2xl font-bold font-heading text-foreground">
                {totalMessagesCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {unreadMessagesCount > 0 ? "Pending review" : "Visitor messages"}
              </p>
            </Link>
          </div>

          {/* Tab Navigation: Articles vs Inquiries */}
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between border-b border-border/70">
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href={`/admin?tab=posts${params.status ? `&status=${params.status}` : ""}${params.language ? `&language=${params.language}` : ""}`}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all -mb-px",
                    activeTab === "posts"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  <span>Articles &amp; Essays</span>
                  <span
                    className={cn(
                      "text-[11px] px-1.5 py-0.2 font-mono font-semibold",
                      activeTab === "posts"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {totalPostsCount}
                  </span>
                </Link>

                <Link
                  href="/admin?tab=messages"
                  className={cn(
                    "inline-flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all -mb-px",
                    activeTab === "messages"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Mail className="h-4 w-4" />
                  <span>Incoming Queries</span>
                  <span
                    className={cn(
                      "text-[11px] px-1.5 py-0.2 font-mono font-semibold",
                      activeTab === "messages"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {totalMessagesCount}
                  </span>
                  {unreadMessagesCount > 0 && (
                    <span className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.2 bg-primary text-primary-foreground font-bold leading-none">
                      {unreadMessagesCount} unread
                    </span>
                  )}
                </Link>
              </div>

              {activeTab === "posts" && (
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Showing {posts.length} {posts.length === 1 ? "article" : "articles"}
                </div>
              )}
            </div>

            {/* TAB CONTENT: ARTICLES */}
            {activeTab === "posts" && (
              <div className="space-y-4">
                {/* Search & Filters Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-3 bg-card border border-border/80 shadow-xs">
                  {/* Search Form */}
                  <form method="GET" className="relative flex-1 max-w-sm">
                    <input type="hidden" name="tab" value="posts" />
                    {params.status && <input type="hidden" name="status" value={params.status} />}
                    {params.language && <input type="hidden" name="language" value={params.language} />}
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      name="search"
                      placeholder="Search articles by title..."
                      defaultValue={params.search || ""}
                      className="pl-9 pr-7 text-xs h-9 bg-background rounded-none"
                    />
                    {params.search && (
                      <Link
                        href={`/admin?tab=posts${params.status ? `&status=${params.status}` : ""}${params.language ? `&language=${params.language}` : ""}`}
                        className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground font-bold"
                        title="Clear search"
                      >
                        ✕
                      </Link>
                    )}
                  </form>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter Group */}
                    <div className="inline-flex items-center border border-border/80 bg-background p-0.5 text-xs">
                      <Link
                        href={`/admin?tab=posts${params.language ? `&language=${params.language}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "px-2.5 py-1 transition-colors font-medium",
                          !params.status
                            ? "bg-muted text-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        All
                      </Link>
                      <Link
                        href={`/admin?tab=posts&status=PUBLISHED${params.language ? `&language=${params.language}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "px-2.5 py-1 transition-colors font-medium",
                          params.status === "PUBLISHED"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Published
                      </Link>
                      <Link
                        href={`/admin?tab=posts&status=DRAFT${params.language ? `&language=${params.language}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "px-2.5 py-1 transition-colors font-medium",
                          params.status === "DRAFT"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Drafts
                      </Link>
                    </div>

                    {/* Language Filter Group */}
                    <div className="inline-flex items-center border border-border/80 bg-background p-0.5 text-xs">
                      <Link
                        href={`/admin?tab=posts${params.status ? `&status=${params.status}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "px-2.5 py-1 transition-colors font-medium",
                          !params.language
                            ? "bg-muted text-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        All Langs
                      </Link>
                      <Link
                        href={`/admin?tab=posts&language=EN${params.status ? `&status=${params.status}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "px-2.5 py-1 transition-colors font-medium",
                          params.language === "EN"
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        EN ({englishCount})
                      </Link>
                      <Link
                        href={`/admin?tab=posts&language=AS${params.status ? `&status=${params.status}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "px-2.5 py-1 transition-colors font-medium",
                          params.language === "AS"
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        অসমীয়া ({assameseCount})
                      </Link>
                    </div>

                    {/* Reset Filters */}
                    {hasActiveFilters && (
                      <Link
                        href="/admin?tab=posts"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "text-xs h-8 px-2 text-muted-foreground hover:text-foreground gap-1"
                        )}
                        title="Reset all filters"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Posts Table */}
                <PostsTable posts={posts} />
              </div>
            )}

            {/* TAB CONTENT: CONTACT INQUIRIES */}
            {activeTab === "messages" && (
              <div className="space-y-4">
                <ContactMessagesTable messages={contactMessages} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
