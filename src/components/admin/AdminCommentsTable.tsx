"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  CornerDownRight,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Send,
  Loader2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

export interface AdminCommentItem {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  authorEmail: string | null;
  content: string;
  isAdminReply: boolean;
  createdAt: Date | string;
  post: {
    id: string;
    title: string;
    slug: string;
    language: "EN" | "AS";
  };
}

interface AdminCommentsTableProps {
  initialComments: AdminCommentItem[];
}

export function AdminCommentsTable({
  initialComments,
}: AdminCommentsTableProps) {
  const [comments, setComments] = useState<AdminCommentItem[]>(initialComments);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Comment deleted");
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Could not delete comment");
    }
  };

  const handleReply = async (comment: AdminCommentItem) => {
    if (!replyContent.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: comment.post.slug,
          parentId: comment.id,
          content: replyContent.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to send reply");

      const data = await res.json();
      toast.success("Official author reply posted!");

      // Add to local state
      setComments((prev) => [
        {
          ...data.reply,
          post: comment.post,
        },
        ...prev,
      ]);

      setReplyingToId(null);
      setReplyContent("");
    } catch {
      toast.error("Could not post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center space-y-3 bg-card/30">
        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/60" />
        <h3 className="font-heading font-medium text-foreground text-base">
          No comments or feedback yet
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          When readers leave questions or reflections on your blog articles, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="divide-y divide-border/60">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "p-5 transition-colors",
                comment.isAdminReply ? "bg-primary/5" : "hover:bg-muted/30"
              )}
            >
              {/* Header row: Author info, Blog title, Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">
                      {comment.authorName}
                    </span>
                    {comment.authorEmail && (
                      <span className="text-xs font-mono text-muted-foreground">
                        ({comment.authorEmail})
                      </span>
                    )}
                    {comment.isAdminReply ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Author Reply</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Reader Feedback
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span>On:</span>
                    <Link
                      href={`/blog/${comment.post.slug}#comments`}
                      target="_blank"
                      className="font-medium text-foreground hover:underline inline-flex items-center gap-1 max-w-xs sm:max-w-md truncate"
                    >
                      <span>{comment.post.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-primary" />
                    </Link>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(comment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {!comment.isAdminReply && (
                    <button
                      type="button"
                      onClick={() => {
                        if (replyingToId === comment.id) {
                          setReplyingToId(null);
                        } else {
                          setReplyingToId(comment.id);
                          setReplyContent("");
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono border border-border/70 hover:bg-muted text-foreground transition-colors cursor-pointer"
                    >
                      <CornerDownRight className="h-3 w-3 text-primary" />
                      <span>{replyingToId === comment.id ? "Cancel" : "Reply"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                    title="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <p className="mt-3 text-sm text-foreground/90 whitespace-pre-line leading-relaxed bg-background/50 p-3 rounded-lg border border-border/50">
                {comment.content}
              </p>

              {/* Inline Reply Form */}
              {replyingToId === comment.id && (
                <div className="mt-3 p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                  <div className="text-xs font-mono font-medium text-primary flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Reply as Prof. Surajit Borkotokey to @{comment.authorName}:</span>
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Type your official response..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full rounded-md border border-border/80 bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary resize-y"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="px-3 py-1 rounded-md text-xs font-mono text-muted-foreground hover:bg-muted cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReply(comment)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      <span>Send Official Reply</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminCommentsTable;
