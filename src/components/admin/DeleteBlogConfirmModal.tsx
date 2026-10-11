"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteBlogConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
  isEditingExisting?: boolean;
  blogTitle?: string;
}

export function DeleteBlogConfirmModal({
  open,
  onClose,
  onConfirm,
  isDeleting = false,
  isEditingExisting = false,
  blogTitle,
}: DeleteBlogConfirmModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isDeleting, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="w-full max-w-md bg-background border border-border/80 rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 relative">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <Trash2 className="h-5 w-5" />
          </div>

          <div className="space-y-1.5 flex-1">
            <h3
              id="delete-dialog-title"
              className="font-heading text-lg font-semibold text-foreground tracking-tight"
            >
              {isEditingExisting
                ? "Delete blog post permanently?"
                : "Delete this blog draft?"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isEditingExisting ? (
                <>
                  Are you sure you want to delete{" "}
                  {blogTitle ? (
                    <strong className="text-foreground font-semibold">
                      &ldquo;{blogTitle}&rdquo;
                    </strong>
                  ) : (
                    "this post"
                  )}
                  ? This will permanently remove it from your website and
                  database. This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to discard this blog? All your current
                  writing, canvas contents, and draft backups will be deleted, and
                  you will return to the admin dashboard.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {isEditingExisting
              ? "All comments, views, and associations with this post will also be removed."
              : "Unsaved text and draft changes cannot be recovered once deleted."}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-xl text-xs h-9 px-4 cursor-pointer"
          >
            Cancel / Keep Writing
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={onConfirm}
            className="rounded-xl text-xs h-9 px-4 gap-1.5 cursor-pointer shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>
                  {isEditingExisting ? "Yes, Delete Post" : "Yes, Delete Draft"}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DeleteBlogConfirmModal;
