import { getAllPostsAdmin } from "@/lib/posts";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostsTable } from "@/components/admin/PostsTable";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, FileText, CheckCircle, FileEdit, Globe2 } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

interface AdminDashboardProps {
  searchParams: Promise<{
    search?: string;
    status?: "DRAFT" | "PUBLISHED";
    language?: "EN" | "AS";
  }>;
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  const params = await searchParams;
  const posts = await getAllPostsAdmin({
    search: params.search,
    status: params.status,
    language: params.language,
  });

  const totalPosts = posts.length;
  const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = posts.filter((p) => p.status === "DRAFT").length;
  const assameseCount = posts.filter((p) => p.language === "AS").length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />

      <main className="flex-1 py-8 sm:py-10">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
          {/* Header Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                Articles &amp; Essays
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your bilingual publication entries, drafts, and archives.
              </p>
            </div>

            <Link
              href="/admin/posts/new"
              className={cn(buttonVariants(), "gap-2")}
            >
              <Plus className="h-4 w-4" />
              <span>Write New Post</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          </div>

          {/* Filter & Search Form */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form method="GET" className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search posts by title, slug..."
                defaultValue={params.search || ""}
                className="pl-9 text-sm"
              />
            </form>

            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className={cn(
                  buttonVariants({
                    variant: !params.status ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  "text-xs"
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
                  "text-xs"
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
                  "text-xs"
                )}
              >
                Drafts
              </Link>
            </div>
          </div>

          {/* Table */}
          <PostsTable posts={posts} />
        </div>
      </main>
    </div>
  );
}
