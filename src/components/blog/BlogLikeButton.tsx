"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "cn";
import { toast } from "sonner";

interface BlogLikeButtonProps {
  slug: string;
  initialLikes?: number;
  variant?: "inline" | "prominent" | "badge";
  className?: string;
}

export function BlogLikeButton({
  slug,
  initialLikes = 0,
  variant = "inline",
  className,
}: BlogLikeButtonProps) {
  const [likes, setLikes] = useState<number>(initialLikes);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Check initial like status from server / local storage
  useEffect(() => {
    let isMounted = true;

    // Check localStorage first for instant client response
    const localLikedKey = `blog_liked_${slug}`;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(localLikedKey);
      if (stored === "true") {
        setHasLiked(true);
      }
    }

    // Fetch confirmed count and status from backend
    fetch(`/api/posts/${slug}/like`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && isMounted) {
          setLikes(data.likes);
          setHasLiked(data.hasLiked);
          if (typeof window !== "undefined") {
            localStorage.setItem(localLikedKey, data.hasLiked ? "true" : "false");
          }
        }
      })
      .catch(() => {
        // Silently fall back to initial state
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleToggleLike = async () => {
    if (isLoading) return;

    // Optimistic UI update
    const nextState = !hasLiked;
    const nextCount = nextState ? likes + 1 : Math.max(0, likes - 1);
    setHasLiked(nextState);
    setLikes(nextCount);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);

    const localLikedKey = `blog_liked_${slug}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(localLikedKey, nextState ? "true" : "false");
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/${slug}/like`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to like");
      }

      const data = await res.json();
      setLikes(data.likes);
      setHasLiked(data.hasLiked);
      if (typeof window !== "undefined") {
        localStorage.setItem(localLikedKey, data.hasLiked ? "true" : "false");
      }

      if (data.hasLiked) {
        toast.success("Thank you for liking this article!");
      }
    } catch {
      // Revert optimistic update on error
      setHasLiked(!nextState);
      setLikes(likes);
      toast.error("Could not update like status");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground",
          className
        )}
      >
        <Heart
          className={cn(
            "h-3 w-3",
            hasLiked ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
          )}
        />
        <span>{likes}</span>
      </span>
    );
  }

  if (variant === "prominent") {
    return (
      <div
        className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/20 shadow-xs",
          className
        )}
      >
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-heading font-semibold text-foreground text-sm sm:text-base">
            Enjoyed this writing?
          </h4>
          <p className="text-xs text-muted-foreground">
            Leave a like or share your constructive thoughts below.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleLike}
          disabled={isLoading}
          aria-label={hasLiked ? "Unlike this article" : "Like this article"}
          className={cn(
            "inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-mono font-medium transition-all duration-300 cursor-pointer shadow-xs active:scale-95 select-none",
            hasLiked
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/15"
              : "bg-card hover:bg-muted text-foreground border border-border/80 hover:border-foreground/40",
            isAnimating && "scale-105"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              hasLiked ? "fill-rose-500 text-rose-500" : "text-muted-foreground",
              isAnimating && "scale-125"
            )}
          />
          <span>{hasLiked ? "Liked" : "Like Article"}</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-muted/60 text-foreground border border-border/40">
            {likes}
          </span>
        </button>
      </div>
    );
  }

  // Default "inline" variant for toolbar / interactive bar
  return (
    <button
      type="button"
      onClick={handleToggleLike}
      disabled={isLoading}
      aria-label={hasLiked ? "Unlike" : "Like"}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all duration-200 cursor-pointer border select-none active:scale-95",
        hasLiked
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
          : "hover:bg-muted hover:text-foreground border-border/50 text-muted-foreground",
        isAnimating && "scale-105",
        className
      )}
      title={hasLiked ? "Unlike" : "Like this essay"}
    >
      <Heart
        className={cn(
          "h-3.5 w-3.5 transition-transform duration-300",
          hasLiked ? "fill-rose-500 text-rose-500" : "text-muted-foreground",
          isAnimating && "scale-125"
        )}
      />
      <span className="text-[11px] font-medium">{likes}</span>
    </button>
  );
}

export default BlogLikeButton;
