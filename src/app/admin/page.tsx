import { getAllPostsAdmin } from "@/lib/posts";
import prisma from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostsTable } from "@/components/admin/PostsTable";
import { ContactMessagesTable } from "@/components/admin/ContactMessagesTable";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, FileText, CheckCircle, FileEdit, Globe2, Mail, PenTool, UploadCloud, ArrowRight } from "lucide-react";
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

  const [posts, contactMessages] = await Promise.all([
    getAllPostsAdmin({
      search: params.search,
      status: params.status,
      language: params.language,
    }),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const totalPosts = posts.length;
  const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = posts.filter((p) => p.status === "DRAFT").length;
  const assameseCount = posts.filter((p) => p.language === "AS").length;
  const unreadMessagesCount = contactMessages.filter((m) => m.status === "UNREAD").length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />

      <main className="flex-1 py-8 sm:py-10">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
          {/* Header Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                Editorial &amp; Academic Admin
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your bilingual publication entries, drafts, and incoming contact queries.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/posts/new?mode=editor"
                className={cn(buttonVariants(), "gap-2")}
              >
                <Plus className="h-4 w-4" />
                <span>Write New Post</span>
              </Link>
            </div>
          </div>

          {/* Two Primary Creation Pathways */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/posts/new?mode=editor"
              className="group block p-5 rounded-none border border-border/80 bg-card hover:border-primary/60 hover:bg-primary/[0.02] transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-primary">
                    <PenTool className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold uppercase text-primary">Option 1</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono px-1.5 py-0.5 font-medium">Bilingual Studio + SMS Keyboard</span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors mt-0.5">
                      Write Post in Studio
                    </h3>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Full-screen distraction-free writing studio supporting English and Assamese (অসমীয়া) with phonetic SMS typing, formatting tools, and instant preview.
              </p>
            </Link>

            <Link
              href="/admin/posts/new?mode=import"
              className="group block p-5 rounded-none border border-border/80 bg-card hover:border-primary/60 hover:bg-primary/[0.02] transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-primary">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold uppercase text-primary">Option 2</span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-mono px-1.5 py-0.5 font-medium">Ready-Made Post Importer</span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors mt-0.5">
                      Post Ready-Made Blog
                    </h3>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Drag &amp; drop an already prepared Markdown/Word file or paste text directly. Upload cover image and attach in-article images with 1-click insertion.
              </p>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Total Posts
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPosts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Published
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {publishedCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Drafts
                </CardTitle>
                <FileEdit className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {draftCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Assamese (অসমীয়া)
                </CardTitle>
                <Globe2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {assameseCount}
                </div>
              </CardContent>
            </Card>

            <Card className={unreadMessagesCount > 0 ? "border-primary/60 bg-primary/5" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Inquiries Received
                </CardTitle>
                <Mail className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-baseline gap-2">
                  <span>{contactMessages.length}</span>
                  {unreadMessagesCount > 0 && (
                    <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5">
                      {unreadMessagesCount} unread
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section: Incoming Contact Inquiries */}
          <div className="space-y-4">
            <ContactMessagesTable messages={contactMessages} />
          </div>

          {/* Section: Posts Management */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Articles &amp; Essays Catalog
                </h2>
                <p className="text-xs text-muted-foreground">
                  Filter and edit published and draft posts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <form method="GET" className="relative max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="search"
                    placeholder="Search posts..."
                    defaultValue={params.search || ""}
                    className="pl-9 text-xs h-9"
                  />
                </form>

                <div className="flex items-center gap-1.5">
                  <Link
                    href="/admin"
                    className={cn(
                      buttonVariants({
                        variant: !params.status ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "text-xs h-8"
                    )}
                  >
                    All
                  </Link>
                  <Link
                    href="/admin?status=PUBLISHED"
                    className={cn(
                      buttonVariants({
                        variant: params.status === "PUBLISHED" ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "text-xs h-8"
                    )}
                  >
                    Published
                  </Link>
                  <Link
                    href="/admin?status=DRAFT"
                    className={cn(
                      buttonVariants({
                        variant: params.status === "DRAFT" ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "text-xs h-8"
                    )}
                  >
                    Drafts
                  </Link>
                </div>
              </div>
            </div>

            <PostsTable posts={posts} />
          </div>
        </div>
      </main>
    </div>
  );
}
