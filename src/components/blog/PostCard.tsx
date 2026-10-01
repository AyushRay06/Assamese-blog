import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, ArrowUpRight } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

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
    tags?: { id: string; name: string }[];
  };
  priority?: boolean;
}

export function PostCard({ post, priority = false }: PostCardProps) {
  const langConfig = SUPPORTED_LANGUAGES[post.language];
  const isAssamese = post.language === "AS";

  const dateObj = post.publishedAt ? new Date(post.publishedAt) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  const readingTimeText = isAssamese
    ? `${post.readingTime} মিনিট পঢ়া`
    : `${post.readingTime} min read`;

  return (
    <article
      lang={langConfig.langAttr}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
    >
      {/* Cover Image */}
      <Link href={`/blog/${post.slug}`} className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-secondary/30 p-6">
            <span className="font-heading text-xl font-bold tracking-tight text-muted-foreground/40">
              {post.title.slice(0, 1)}
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <Badge
            variant={post.language === "AS" ? "default" : "secondary"}
            className="font-medium text-xs shadow-sm backdrop-blur-md"
          >
            {langConfig.nativeName}
          </Badge>
        </div>
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Meta row: Date and Reading time */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={dateObj ? dateObj.toISOString() : undefined}>
              {formattedDate}
            </time>
          </div>
          <span>&bull;</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{readingTimeText}</span>
          </div>
        </div>

        {/* Title */}
        <h2
          className={`font-bold tracking-tight text-foreground transition-colors group-hover:text-primary ${
            isAssamese
              ? "font-assamese text-xl sm:text-2xl leading-relaxed"
              : "font-heading text-lg sm:text-xl leading-snug"
          }`}
        >
          <Link href={`/blog/${post.slug}`} className="focus:outline-none">
            <span className="absolute inset-0 z-10" />
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p
            className={`mt-2.5 line-clamp-3 text-sm text-muted-foreground ${
              isAssamese ? "font-assamese leading-relaxed" : "leading-normal"
            }`}
          >
            {post.excerpt}
          </p>
        )}

        {/* Footer: Tags and Arrow */}
        <div className="mt-auto pt-5 flex items-center justify-between gap-2 border-t border-border/40 text-xs">
          <div className="flex flex-wrap gap-1.5 z-20">
            {post.tags && post.tags.length > 0 ? (
              post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                >
                  #{tag.name}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground/60">Article</span>
            )}
          </div>

          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-transform duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:translate-x-0.5">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </article>
  );
}
