import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
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
    : "Recent";

  const readingTimeText = isAssamese
    ? `${post.readingTime} মিনিট`
    : `${post.readingTime} min read`;

  return (
    <article
      lang={langConfig.langAttr}
      className="group flex flex-col space-y-4"
    >
      {/* Cover Image Container */}
      <Link
        href={`/blog/${post.slug}`}
        prefetch={true}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/70 bg-muted/20 transition-all duration-300 group-hover:border-foreground/40 group-hover:shadow-sm"
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
              {isAssamese ? "অসমীয়া নিবন্ধ" : "Essay"}
            </span>
          </div>
        )}

        {/* Minimal Language Tag Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-medium text-foreground border border-border/60 shadow-xs">
            {langConfig.nativeName}
          </span>
        </div>
      </Link>

      {/* Meta: Date & Reading Time */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <time dateTime={dateObj ? dateObj.toISOString() : undefined}>
          {formattedDate}
        </time>
        <span>&bull;</span>
        <span>{readingTimeText}</span>
      </div>

      {/* Title */}
      <h3
        className={`font-semibold tracking-tight text-foreground transition-colors group-hover:text-foreground/75 ${
          isAssamese
            ? "font-assamese text-xl sm:text-2xl leading-snug"
            : "font-heading text-lg sm:text-xl leading-snug"
        }`}
      >
        <Link href={`/blog/${post.slug}`} prefetch={true} className="inline-flex items-center gap-1.5">
          <span>{post.title}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </h3>

      {/* Excerpt */}
      {post.excerpt && (
        <p
          className={`line-clamp-2 text-sm text-muted-foreground leading-relaxed ${
            isAssamese ? "font-assamese" : ""
          }`}
        >
          {post.excerpt}
        </p>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="text-[11px] font-mono text-muted-foreground/70"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default PostCard;
