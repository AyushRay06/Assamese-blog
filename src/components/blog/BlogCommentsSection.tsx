"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  CornerDownRight,
  Send,
  Trash2,
  ShieldCheck,
  User,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { CommentWithReplies } from "@/lib/comments";

interface BlogCommentsSectionProps {
  slug: string;
  isAssamese?: boolean;
}

export function BlogCommentsSection({
  slug,
  isAssamese = false,
}: BlogCommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New root comment form state
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active reply form state (parentId of comment being replied to)
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthorName, setReplyAuthorName] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${slug}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setIsAdmin(Boolean(data.isAdmin));
      }
    } catch {
      // Ignore network errors on initial mount
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [slug]);

  // Handle posting a new top-level comment
  const handleSubmitRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error(isAssamese ? "অনুগ্ৰহ কৰি আপোনাৰ মতামত লিখক" : "Please enter your comment.");
      return;
    }

    if (!isAdmin && !authorName.trim()) {
      toast.error(isAssamese ? "অনুগ্ৰহ কৰি আপোনাৰ নাম লিখক" : "Please enter your name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: isAdmin ? "Prof. Surajit Borkotokey" : authorName.trim(),
          authorEmail: authorEmail.trim() || undefined,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post comment");
      }

      toast.success(isAssamese ? "আপোনাৰ মতামত প্ৰকাশ কৰা হৈছে!" : "Comment posted successfully!");
      setContent("");
      if (!isAdmin) {
        setAuthorEmail("");
      }
      await fetchComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error posting comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle posting a reply to a comment
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      toast.error(isAssamese ? "অনুগ্ৰহ কৰি উত্তৰ লিখক" : "Please enter your reply.");
      return;
    }

    if (!isAdmin && !replyAuthorName.trim()) {
      toast.error(isAssamese ? "অনুগ্ৰহ কৰি আপোনাৰ নাম লিখক" : "Please enter your name.");
      return;
    }

    setIsSubmittingReply(true);
    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          authorName: isAdmin ? "Prof. Surajit Borkotokey" : replyAuthorName.trim(),
          content: replyContent.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reply");
      }

      toast.success(
        isAdmin
          ? isAssamese
            ? "প্ৰবন্ধকাৰৰ উত্তৰ প্ৰকাশ কৰা হৈছে!"
            : "Admin reply posted!"
          : isAssamese
          ? "উত্তৰ প্ৰকাশ কৰা হৈছে!"
          : "Reply posted!"
      );
      setReplyingToId(null);
      setReplyContent("");
      setReplyAuthorName("");
      await fetchComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error posting reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle comment deletion (admin only)
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(isAssamese ? "আপুনি এই মতামতটো বিলোপ কৰিব বিচাৰেনে?" : "Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete comment");
      }

      toast.success(isAssamese ? "মতামত বিলোপ কৰা হ'ল" : "Comment deleted");
      await fetchComments();
    } catch {
      toast.error("Could not delete comment");
    }
  };

  const totalCommentCount = comments.reduce(
    (acc, curr) => acc + 1 + (curr.replies?.length || 0),
    0
  );

  return (
    <section id="comments" className="mt-16 pt-12 border-t border-border/70">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {isAssamese ? "আলোচনা আৰু পাঠকৰ মতামত" : "Discussion & Reader Feedback"}
            </h3>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {totalCommentCount}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isAssamese
              ? "এই নিবন্ধৰ সন্দৰ্ভত আপোনাৰ চিন্তা, গঠনমূলক প্ৰশ্ন বা মতামত ব্যক্ত কৰক।"
              : "Share your constructive thoughts, academic inquiries, or reflections on this essay."}
          </p>
        </div>

        {isAdmin && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium self-start sm:self-auto">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Mode (Prof. Surajit Borkotokey)</span>
          </div>
        )}
      </div>

      {/* Post a Comment Form */}
      <div className="p-5 sm:p-7 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs mb-10 shadow-xs">
        <form onSubmit={handleSubmitRootComment} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{isAssamese ? "নতুন মন্তব্য যোগ কৰক" : "Leave a Comment / Feedback"}</span>
            </span>
          </div>

          {!isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                  {isAssamese ? "আপোনাৰ নাম *" : "Your Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAssamese ? "যেনে: ড° অঞ্জল বৰা" : "e.g., Dr. Anjal Bora"}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full rounded-lg border border-border/70 bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                  {isAssamese ? "ইমেইল (ঐচ্ছিক)" : "Email Address (Optional)"}
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  className="w-full rounded-lg border border-border/70 bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5">
              {isAdmin
                ? "Admin Message (Posting as Prof. Surajit Borkotokey)"
                : isAssamese
                ? "আপোনাৰ বাৰ্তা বা মন্তব্য *"
                : "Your Feedback or Inquiries *"}
            </label>
            <textarea
              required
              rows={3}
              placeholder={
                isAssamese
                  ? "এই নিবন্ধৰ বিষয়ে আপোনাৰ মতামত ইয়াত লিখক..."
                  : "Write your thoughts, questions, or comments here..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-y"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono text-muted-foreground/70 hidden sm:inline">
              {isAdmin
                ? "Your response will be verified with the official Author badge."
                : "Be polite and constructive in academic discourse."}
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-medium hover:bg-foreground/90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs ml-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{isAssamese ? "প্ৰেৰণ হৈছে..." : "Posting..."}</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>{isAssamese ? "মন্তব্য পঠাওক" : "Post Comment"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 font-mono text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-8 sm:p-12 text-center space-y-3">
          <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <h4 className="font-heading font-medium text-foreground text-sm sm:text-base">
            {isAssamese ? "এতিয়ালৈকে কোনো মন্তব্য নাই" : "No comments yet"}
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {isAssamese
              ? "প্ৰথমজন হওক যিয়ে এই নিবন্ধটোৰ ওপৰত নিজৰ চিন্তা আৰু মতামত প্ৰকাশ কৰিব।"
              : "Be the first reader to share your feedback or ask a question about this essay."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "rounded-2xl border border-border/70 p-5 sm:p-6 transition-all duration-200",
                comment.isAdminReply
                  ? "bg-primary/5 border-primary/20 shadow-xs"
                  : "bg-card/40 hover:bg-card/70"
              )}
            >
              {/* Comment Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-mono font-medium shadow-2xs shrink-0",
                      comment.isAdminReply
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {comment.isAdminReply ? "SB" : comment.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-semibold text-sm text-foreground">
                        {comment.authorName}
                      </span>
                      {comment.isAdminReply && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
                          <ShieldCheck className="h-3 w-3" />
                          <span>{isAssamese ? "প্ৰবন্ধকাৰ (Author)" : "Author & Researcher"}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground/75 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <time dateTime={new Date(comment.createdAt).toISOString()}>
                        {new Date(comment.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                  </div>
                </div>

                {/* Admin Delete Action */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                    title="Delete comment (Admin only)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Comment Body */}
              <p className="mt-3.5 text-sm text-foreground/90 leading-relaxed whitespace-pre-line pl-12">
                {comment.content}
              </p>

              {/* Reply Button Trigger */}
              <div className="pl-12 pt-3 flex items-center gap-3">
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
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline cursor-pointer"
                >
                  <CornerDownRight className="h-3 w-3" />
                  <span>
                    {replyingToId === comment.id
                      ? isAssamese
                        ? "বাতিল কৰক"
                        : "Cancel"
                      : isAssamese
                      ? "উত্তৰ দিয়ক"
                      : "Reply"}
                  </span>
                </button>
              </div>

              {/* Inline Reply Form */}
              {replyingToId === comment.id && (
                <div className="mt-4 ml-12 p-4 rounded-xl border border-border/80 bg-background/80 shadow-xs space-y-3">
                  <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <CornerDownRight className="h-3 w-3 text-primary" />
                    <span>
                      {isAdmin
                        ? `Admin Reply to @${comment.authorName}:`
                        : `Replying to @${comment.authorName}:`}
                    </span>
                  </div>

                  {!isAdmin && (
                    <input
                      type="text"
                      placeholder="Your name *"
                      value={replyAuthorName}
                      onChange={(e) => setReplyAuthorName(e.target.value)}
                      className="w-full rounded-md border border-border/70 bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                    />
                  )}

                  <textarea
                    rows={2}
                    placeholder={
                      isAdmin
                        ? "Type official author reply here..."
                        : "Write your reply..."
                    }
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full rounded-md border border-border/70 bg-card p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary resize-y"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="px-3 py-1.5 rounded-md text-xs font-mono text-muted-foreground hover:bg-muted cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={isSubmittingReply}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-foreground text-background text-xs font-mono font-medium hover:bg-foreground/90 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isSubmittingReply ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      <span>{isAdmin ? "Send Admin Reply" : "Send Reply"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 ml-6 sm:ml-12 border-l-2 border-border/60 pl-4 space-y-3 pt-1">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={cn(
                        "p-4 rounded-xl border border-border/60 transition-colors",
                        reply.isAdminReply
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-mono shrink-0",
                              reply.isAdminReply
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {reply.isAdminReply ? "SB" : reply.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-heading font-medium text-xs text-foreground">
                                {reply.authorName}
                              </span>
                              {reply.isAdminReply && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
                                  <ShieldCheck className="h-2.5 w-2.5" />
                                  <span>Author (Official)</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/70">
                              <Clock className="h-2.5 w-2.5" />
                              <time dateTime={new Date(reply.createdAt).toISOString()}>
                                {new Date(reply.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </time>
                            </div>
                          </div>
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(reply.id)}
                            className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete reply (Admin only)"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <p className="mt-2 text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line pl-9">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default BlogCommentsSection;
