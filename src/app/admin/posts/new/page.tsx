import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostForm } from "@/components/admin/PostForm";

export default function NewPostPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />

      <main className="flex-1 py-8 sm:py-10">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <PostForm />
        </div>
      </main>
    </div>
  );
}
