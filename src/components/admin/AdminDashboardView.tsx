"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { cn } from "cn";

interface PostItem {
  id: string;
  title: string;
  slug: string;
  language: "EN" | "AS";
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  readingTime: number;
  tags: { id: string; name: string }[];
}

interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: Date | string;
}

interface AdminDashboardViewProps {
  initialPosts: PostItem[];
  initialMessages: ContactMessageItem[];
  stats: {
    totalPostsCount: number;
    publishedCount: number;
    draftCount: number;
    assameseCount: number;
    englishCount: number;
    unreadMessagesCount: number;
    totalMessagesCount: number;
  };
  initialTab?: "posts" | "messages";
  initialStatus?: "DRAFT" | "PUBLISHED";
  initialLanguage?: "EN" | "AS";
  initialSearch?: string;
}

export function AdminDashboardView({
  initialPosts,
  initialMessages,
  stats,
  initialTab = "posts",
  initialStatus,
  initialLanguage,
  initialSearch = "",
}: AdminDashboardViewProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState<"posts" | "messages">(initialTab);
  const [statusFilter, setStatusFilter] = React.useState<"DRAFT" | "PUBLISHED" | undefined>(
    initialStatus
  );
  const [languageFilter, setLanguageFilter] = React.useState<"EN" | "AS" | undefined>(
    initialLanguage
  );
  const [searchQuery, setSearchQuery] = React.useState(initialSearch);

  // Sync state to URL shallowly without triggering server network roundtrips
  const updateUrl = React.useCallback(
    (tab: "posts" | "messages", status?: string, language?: string, search?: string) => {
      const params = new URLSearchParams();
      if (tab !== "posts") params.set("tab", tab);
      if (status) params.set("status", status);
      if (language) params.set("language", language);
      if (search && search.trim()) params.set("search", search.trim());

      const newUrl = params.toString() ? `/admin?${params.toString()}` : "/admin";
      window.history.replaceState(null, "", newUrl);
    },
    []
  );

  const handleTabChange = (tab: "posts" | "messages") => {
    setActiveTab(tab);
    updateUrl(tab, statusFilter, languageFilter, searchQuery);
  };

  const handleStatusChange = (status: "DRAFT" | "PUBLISHED" | undefined) => {
    setStatusFilter(status);
    setActiveTab("posts");
    updateUrl("posts", status, languageFilter, searchQuery);
  };

  const handleLanguageChange = (language: "EN" | "AS" | undefined) => {
    setLanguageFilter(language);
    setActiveTab("posts");
    updateUrl("posts", statusFilter, language, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateUrl(activeTab, statusFilter, languageFilter, query);
  };

  const handleResetFilters = () => {
    setStatusFilter(undefined);
    setLanguageFilter(undefined);
    setSearchQuery("");
    updateUrl("posts", undefined, undefined, "");
  };

  // Instant client-side filtering (0ms latency)
  const filteredPosts = React.useMemo(() => {
    let result = initialPosts;
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (languageFilter) {
      result = result.filter((p) => p.language === languageFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }
    return result;
  }, [initialPosts, statusFilter, languageFilter, searchQuery]);

  const hasActiveFilters = Boolean(statusFilter || languageFilter || searchQuery.trim());

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 space-y-8 sm:space-y-10">
      {/* Header Row */}
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

      {/* Minimalist Metrics Strip */}
      <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xs p-4 sm:p-6 shadow-xs">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {/* All Blogs */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("posts");
              handleResetFilters();
            }}
            className={cn(
              "flex flex-col gap-1 rounded-xl p-3 sm:p-3.5 transition-all text-left cursor-pointer",
              activeTab === "posts" && !statusFilter && !languageFilter && !searchQuery
                ? "bg-secondary text-foreground"
                : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-xs font-medium">All Blogs</span>
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground font-heading">
              {stats.totalPostsCount}
            </span>
            <span className="text-[11px] text-muted-foreground/70">Archive</span>
          </button>

          {/* Published */}
          <button
            type="button"
            onClick={() => handleStatusChange("PUBLISHED")}
            className={cn(
              "flex flex-col gap-1 rounded-xl p-3 sm:p-3.5 transition-all text-left cursor-pointer",
              statusFilter === "PUBLISHED"
                ? "bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Published</span>
            </div>
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-heading">
              {stats.publishedCount}
            </span>
            <span className="text-[11px] text-muted-foreground/70">Live on site</span>
          </button>

          {/* Drafts */}
          <button
            type="button"
            onClick={() => handleStatusChange("DRAFT")}
            className={cn(
              "flex flex-col gap-1 rounded-xl p-3 sm:p-3.5 transition-all text-left cursor-pointer",
              statusFilter === "DRAFT"
                ? "bg-amber-500/10 text-amber-950 dark:text-amber-200"
                : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Drafts</span>
            </div>
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-amber-600 dark:text-amber-400 font-heading">
              {stats.draftCount}
            </span>
            <span className="text-[11px] text-muted-foreground/70">In progress</span>
          </button>

          {/* Assamese */}
          <button
            type="button"
            onClick={() => handleLanguageChange("AS")}
            className={cn(
              "flex flex-col gap-1 rounded-xl p-3 sm:p-3.5 transition-all text-left cursor-pointer",
              languageFilter === "AS"
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>অসমীয়া</span>
            </div>
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary font-heading">
              {stats.assameseCount}
            </span>
            <span className="text-[11px] text-muted-foreground/70">Assamese</span>
          </button>

          {/* Contact Inquiries */}
          <button
            type="button"
            onClick={() => handleTabChange("messages")}
            className={cn(
              "flex flex-col gap-1 rounded-xl p-3 sm:p-3.5 transition-all text-left cursor-pointer col-span-2 sm:col-span-1",
              activeTab === "messages"
                ? "bg-secondary text-foreground"
                : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Inquiries</span>
              {stats.unreadMessagesCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground font-semibold">
                  {stats.unreadMessagesCount} unread
                </span>
              )}
            </div>
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground font-heading">
              {stats.totalMessagesCount}
            </span>
            <span className="text-[11px] text-muted-foreground/70">Reader messages</span>
          </button>
        </div>
      </div>

      {/* Section: Floating Pill Tabs */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="inline-flex items-center p-1 rounded-full bg-muted/40 border border-border/40">
            <button
              type="button"
              onClick={() => handleTabChange("posts")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer",
                activeTab === "posts"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Blogs</span>
              <span className="text-[11px] opacity-70 font-mono">
                ({stats.totalPostsCount})
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("messages")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer",
                activeTab === "messages"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Inquiries</span>
              <span className="text-[11px] opacity-70 font-mono">
                ({stats.totalMessagesCount})
              </span>
              {stats.unreadMessagesCount > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {activeTab === "posts" && (
            <div className="text-xs text-muted-foreground">
              Showing {filteredPosts.length} of {stats.totalPostsCount} blogs
            </div>
          )}
        </div>

        {/* TAB CONTENT: BLOGS */}
        {activeTab === "posts" && (
          <div className="space-y-5">
            {/* Search & Filters: Instant, Minimal, Open */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Instant Search Input */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search blogs..."
                  className="pl-9 pr-8 text-xs h-9 bg-muted/20 border-border/40 rounded-full focus:bg-background transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter Pills */}
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(undefined)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      !statusFilter
                        ? "bg-foreground text-background font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("PUBLISHED")}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      statusFilter === "PUBLISHED"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    Published ({stats.publishedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("DRAFT")}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      statusFilter === "DRAFT"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    Drafts ({stats.draftCount})
                  </button>
                </div>

                <div className="h-4 w-px bg-border/40 mx-1 hidden sm:block" />

                {/* Language Filter Pills */}
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange(undefined)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      !languageFilter
                        ? "bg-foreground text-background font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    All Langs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("EN")}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      languageFilter === "EN"
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    EN ({stats.englishCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("AS")}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      languageFilter === "AS"
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    অসমীয়া ({stats.assameseCount})
                  </button>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center gap-1 transition-colors ml-1 cursor-pointer"
                    title="Reset all filters"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Posts Table */}
            <PostsTable posts={filteredPosts} />
          </div>
        )}

        {/* TAB CONTENT: CONTACT INQUIRIES */}
        {activeTab === "messages" && (
          <div className="space-y-4">
            <ContactMessagesTable messages={initialMessages} />
          </div>
        )}
      </div>
    </div>
  );
}
