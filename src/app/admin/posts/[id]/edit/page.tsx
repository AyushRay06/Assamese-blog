import { notFound } from "next/navigation";
import { getPostByIdAdmin } from "@/lib/posts";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostForm } from "@/components/admin/PostForm";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const post = await getPostByIdAdmin(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />

      <main className="flex-1 py-8 sm:py-10">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <PostForm
            initialData={{
              id: post.id,
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              coverImage: post.coverImage,
              content: post.content as object,
              contentHtml: post.contentHtml,
              language: post.language,
              status: post.status,
              publishedAt: post.publishedAt,
              tags: post.tags,
            }}
          />
        </div>
      </main>
    </div>
  );
}
