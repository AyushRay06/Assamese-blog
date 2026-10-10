import { getAllPostsAdmin } from "@/lib/posts";
import prisma from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostsTable } from "@/components/admin/PostsTable";
import { ContactMessagesTable } from "@/components/admin/ContactMessagesTable";
import { NewPostDropdown } from "@/components/admin/NewPostDropdown";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileText,
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
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <AdminHeader
        unreadMessagesCount={unreadMessagesCount}
        activeTab={activeTab}
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto max-w-6xl px-4 sm:px-8 space-y-8 sm:space-y-10">
          {/* Header Row: Clean, Open, Generous Spacing */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Overview
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Bilingual publications, drafts, and visitor inquiries.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <NewPostDropdown />
            </div>
          </div>

          {/* Minimalist Metrics Strip: Open, Borderless, Breathing Room */}
          <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xs p-4 sm:p-6 shadow-xs">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {/* All Articles */}
              <Link
                href="/admin?tab=posts"
                className={cn(
                  "flex flex-col gap-1 rounded-xl p-3 sm:p-3.5 transition-all",
                  activeTab === "posts" && !params.status && !params.language
                    ? "bg-secondary text-foreground"
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-xs font-medium">All Articles</span>
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground font-heading">
                  {totalPostsCount}
                </span>
                <span className="text-[11px] text-muted-foreground/70">Archive</span>
              </Link>

              {/* Published */}
              <Link
                href="/admin?tab=posts&status=PUBLISHED"
                className={cn(
                  "flex flex-col gap-1 rounded-xl p-3 sm:p-3.5 transition-all",
                  params.status === "PUBLISHED"
                    ? "bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Published</span>
                </div>
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-heading">
                  {publishedCount}
                </span>
                <span className="text-[11px] text-muted-foreground/70">Live on site</span>
              </Link>

              {/* Drafts */}
              <Link
                href="/admin?tab=posts&status=DRAFT"
                className={cn(
                  "flex flex-col gap-1 rounded-xl p-3 sm:p-3.5 transition-all",
                  params.status === "DRAFT"
                    ? "bg-amber-500/10 text-amber-950 dark:text-amber-200"
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>Drafts</span>
                </div>
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-amber-600 dark:text-amber-400 font-heading">
                  {draftCount}
                </span>
                <span className="text-[11px] text-muted-foreground/70">In progress</span>
              </Link>

              {/* Assamese */}
              <Link
                href="/admin?tab=posts&language=AS"
                className={cn(
                  "flex flex-col gap-1 rounded-xl p-3 sm:p-3.5 transition-all",
                  params.language === "AS"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>অসমীয়া</span>
                </div>
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary font-heading">
                  {assameseCount}
                </span>
                <span className="text-[11px] text-muted-foreground/70">Assamese</span>
              </Link>

              {/* Contact Inquiries */}
              <Link
                href="/admin?tab=messages"
                className={cn(
                  "flex flex-col gap-1 rounded-xl p-3 sm:p-3.5 transition-all col-span-2 sm:col-span-1",
                  activeTab === "messages"
                    ? "bg-secondary text-foreground"
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>Inquiries</span>
                  {unreadMessagesCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground font-semibold">
                      {unreadMessagesCount} unread
                    </span>
                  )}
                </div>
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground font-heading">
                  {totalMessagesCount}
                </span>
                <span className="text-[11px] text-muted-foreground/70">Reader messages</span>
              </Link>
            </div>
          </div>

          {/* Section: Minimal Floating Pill Tabs */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="inline-flex items-center p-1 rounded-full bg-muted/40 border border-border/40">
                <Link
                  href={`/admin?tab=posts${params.status ? `&status=${params.status}` : ""}${params.language ? `&language=${params.language}` : ""}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                    activeTab === "posts"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Articles</span>
                  <span className="text-[11px] opacity-70 font-mono">({totalPostsCount})</span>
                </Link>

                <Link
                  href="/admin?tab=messages"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                    activeTab === "messages"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Inquiries</span>
                  <span className="text-[11px] opacity-70 font-mono">({totalMessagesCount})</span>
                  {unreadMessagesCount > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              </div>

              {activeTab === "posts" && (
                <div className="text-xs text-muted-foreground">
                  Showing {posts.length} {posts.length === 1 ? "article" : "articles"}
                </div>
              )}
            </div>

            {/* TAB CONTENT: ARTICLES */}
            {activeTab === "posts" && (
              <div className="space-y-5">
                {/* Search & Filters: Open & Minimal (NO BOX WRAPPER) */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  {/* Search Form */}
                  <form method="GET" className="relative flex-1 max-w-xs">
                    <input type="hidden" name="tab" value="posts" />
                    {params.status && <input type="hidden" name="status" value={params.status} />}
                    {params.language && <input type="hidden" name="language" value={params.language} />}
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      name="search"
                      placeholder="Search articles..."
                      defaultValue={params.search || ""}
                      className="pl-9 pr-8 text-xs h-9 bg-muted/20 border-border/40 rounded-full focus:bg-background transition-colors"
                    />
                    {params.search && (
                      <Link
                        href={`/admin?tab=posts${params.status ? `&status=${params.status}` : ""}${params.language ? `&language=${params.language}` : ""}`}
                        className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground font-medium"
                        title="Clear search"
                      >
                        ✕
                      </Link>
                    )}
                  </form>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter Pills */}
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/admin?tab=posts${params.language ? `&language=${params.language}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          !params.status
                            ? "bg-foreground text-background font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        All
                      </Link>
                      <Link
                        href={`/admin?tab=posts&status=PUBLISHED${params.language ? `&language=${params.language}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          params.status === "PUBLISHED"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        Published ({publishedCount})
                      </Link>
                      <Link
                        href={`/admin?tab=posts&status=DRAFT${params.language ? `&language=${params.language}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          params.status === "DRAFT"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        Drafts ({draftCount})
                      </Link>
                    </div>

                    <div className="h-4 w-px bg-border/40 mx-1 hidden sm:block" />

                    {/* Language Filter Pills */}
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/admin?tab=posts${params.status ? `&status=${params.status}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          !params.language
                            ? "bg-foreground text-background font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        All Langs
                      </Link>
                      <Link
                        href={`/admin?tab=posts&language=EN${params.status ? `&status=${params.status}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          params.language === "EN"
                            ? "bg-primary/15 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        EN ({englishCount})
                      </Link>
                      <Link
                        href={`/admin?tab=posts&language=AS${params.status ? `&status=${params.status}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          params.language === "AS"
                            ? "bg-primary/15 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        অসমীয়া ({assameseCount})
                      </Link>
                    </div>

                    {/* Reset Filters */}
                    {hasActiveFilters && (
                      <Link
                        href="/admin?tab=posts"
                        className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center gap-1 transition-colors ml-1"
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
