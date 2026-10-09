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
        await deletePostAction(deleteId);
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
      <div className="rounded-none border border-dashed p-12 text-center">
        <h3 className="text-base font-semibold text-foreground">No posts created yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by crafting your first bilingual essay or thought.
        </p>
        <Link
          href="/admin/posts/new"
          className={cn(buttonVariants({ size: "sm" }), "mt-4")}
        >
          Create New Post
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-none border bg-card shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[45%]">Title &amp; Slug</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                    <Badge variant={post.language === "AS" ? "default" : "secondary"}>
                      {langConfig.label} ({langConfig.nativeName})
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={isPublished ? "default" : "outline"}
                      className={
                        isPublished
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "text-muted-foreground"
                      }
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
                          "h-8 w-8"
                        )}
                        title="Edit post"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "h-8 w-8"
                          )}
                          disabled={isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
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
