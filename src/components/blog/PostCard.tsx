import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { BlogCoverImage } from "./BlogCoverImage";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    language: "EN" | "AS";
    publishedAt: Date | string | null;
    readingTime: number;
    likes?: number;
    tags?: { id: string; name: string }[];
  };
  priority?: boolean;
  showPlaceholder?: boolean;
}

export function PostCard({
  post,
  priority = false,
  showPlaceholder = true,
}: PostCardProps) {
  const langConfig = SUPPORTED_LANGUAGES[post.language];
  const isAssamese = post.language === "AS";

  const dateObj = post.publishedAt ? new Date(post.publishedAt) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent";

  const readingTimeText = isAssamese
    ? `${post.readingTime} মিনিট`
    : `${post.readingTime} min read`;

  return (
    <article
      lang={langConfig.langAttr}
      className="group flex flex-col h-full rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs hover:border-foreground/30 hover:bg-card/95 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* 16:9 Cover Image or Placeholder Container */}
      <Link
        href={`/blog/${post.slug}`}
        prefetch={true}
        className="relative block overflow-hidden border-b border-border/60 bg-muted/20"
      >
        <BlogCoverImage
          src={post.coverImage}
          alt={post.title}
          isAssamese={isAssamese}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          usePlaceholder={showPlaceholder}
        />

        {/* Language Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-medium text-foreground border border-border/60 shadow-xs">
            {langConfig.nativeName}
          </span>
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-4">
        {/* Top Info: Meta, Title, Excerpt */}
        <div className="space-y-3">
          {/* Meta: Date, Reading Time & Likes */}
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <time dateTime={dateObj ? dateObj.toISOString() : undefined}>
              {formattedDate}
            </time>
            <span>&bull;</span>
            <span>{readingTimeText}</span>
            {typeof post.likes === "number" && post.likes > 0 && (
              <>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1 text-rose-500/90 font-medium">
                  <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                  <span>{post.likes}</span>
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-semibold tracking-tight text-foreground transition-colors group-hover:text-foreground/80 line-clamp-2 ${
              isAssamese
                ? "font-assamese text-xl sm:text-2xl leading-snug"
                : "font-heading text-lg sm:text-xl leading-snug"
            }`}
          >
            <Link
              href={`/blog/${post.slug}`}
              prefetch={true}
              className="inline-flex items-baseline gap-1"
            >
              <span>{post.title}</span>
            </Link>
          </h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p
              className={`line-clamp-3 text-xs sm:text-sm text-muted-foreground leading-relaxed ${
                isAssamese ? "font-assamese" : ""
              }`}
            >
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Card Footer: Tags & Read Arrow */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2 mt-auto">
          {post.tags && post.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 overflow-hidden">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="text-[10px] font-mono text-muted-foreground/80 bg-muted/40 px-2 py-0.5 rounded border border-border/40"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[10px] font-mono text-muted-foreground/60">
              {isAssamese ? "নিবন্ধ" : "Article"}
            </span>
          )}

          <Link
            href={`/blog/${post.slug}`}
            prefetch={true}
            className="inline-flex items-center gap-1 text-xs font-mono font-medium text-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
          >
            <span>{isAssamese ? "পঢ়ক" : "Read"}</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PostCard;
