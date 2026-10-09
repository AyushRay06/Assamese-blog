import Link from "next/link";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/40 py-8 transition-colors">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground font-mono">
            Surajit Borkotokey &bull; Department of Mathematics, Dibrugarh University
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
            <Link
              href="/blog"
              className="transition-colors hover:text-foreground"
            >
              Blogs
            </Link>
            <span>&bull;</span>
            <Link
              href="/admin"
              className="transition-colors hover:text-foreground text-muted-foreground/80"
            >
              Admin
            </Link>
            <span>&bull;</span>
            <span>&copy; {currentYear}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default PublicFooter;
