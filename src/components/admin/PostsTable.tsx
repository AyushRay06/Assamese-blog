"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit3,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { deletePostAction, togglePostStatusAction } from "@/actions/posts";
import { toast } from "sonner";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
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

interface PostsTableProps {
  posts: PostItem[];
}

export function PostsTable({ posts }: PostsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    startTransition(async () => {
      try {
        const result = await deletePostAction(deleteId);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Post deleted successfully");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete post");
      } finally {
        setDeleteId(null);
      }
    });
  };

  const handleToggleStatus = (id: string) => {
    startTransition(async () => {
      try {
        const result = await togglePostStatusAction(id);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(
          result.status === "PUBLISHED" ? "Post published" : "Post moved to drafts"
        );
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to change status");
      }
    });
  };

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/20 p-12 text-center">
        <h3 className="text-base font-semibold text-foreground">No articles match your current view</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          Try clearing your search or status filters, or start writing a new bilingual essay.
        </p>
        <div className="flex items-center justify-center gap-2 mt-5">
          <Link
            href="/admin?tab=posts"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs rounded-full px-4")}
          >
            Clear Filters
          </Link>
          <Link
            href="/admin/posts/new"
            className={cn(buttonVariants({ size: "sm" }), "text-xs rounded-full px-4")}
          >
            Write New Post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xs shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 border-b border-border/40 hover:bg-muted/20">
              <TableHead className="w-[45%] text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Title &amp; Slug</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Language</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Published</TableHead>
              <TableHead className="text-right text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => {
              const langConfig = SUPPORTED_LANGUAGES[post.language];
              const isPublished = post.status === "PUBLISHED";
              const dateText = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Not published";

              return (
                <TableRow key={post.id} className="hover:bg-muted/30">
                  {/* Title & Slug */}
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className={`text-sm font-semibold transition-colors hover:text-primary ${
                          post.language === "AS" ? "font-assamese text-base" : ""
                        }`}
                      >
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono text-[11px] truncate max-w-[200px] sm:max-w-[300px]">
                          /{post.slug}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTime}m
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Language */}
                  <TableCell>
                    <Badge
                      variant={post.language === "AS" ? "default" : "secondary"}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      {langConfig.label} ({langConfig.nativeName})
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={isPublished ? "default" : "outline"}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                        isPublished
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "text-muted-foreground border-border/60"
                      )}
                    >
                      {post.status}
                    </Badge>
                  </TableCell>

                  {/* Published Date */}
                  <TableCell className="text-xs text-muted-foreground">
                    {dateText}
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon" }),
                          "h-8 w-8 rounded-full hover:bg-muted/60"
                        )}
                        title="Edit post"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "h-8 w-8 rounded-full hover:bg-muted/60"
                          )}
                          disabled={isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-xl shadow-lg border-border/40">
                          {isPublished && (
                            <DropdownMenuItem
                              onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>View Live</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(post.id)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            {isPublished ? (
                              <>
                                <EyeOff className="h-4 w-4" />
                                <span>Switch to Draft</span>
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4" />
                                <span>Publish Now</span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setDeleteId(post.id)}
                            className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this post and remove its URL from your blog.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
