import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostForm } from "@/components/admin/PostForm";
import { ReadyMadeBlogImporter } from "@/components/admin/ReadyMadeBlogImporter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenTool, UploadCloud } from "lucide-react";

interface NewPostPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  const params = await searchParams;
  const initialMode = params.mode === "import" ? "import" : "editor";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />

      <main className="flex-1 py-8 sm:py-10">
        <div className="w-full px-4 sm:px-8 lg:px-12 space-y-8">
          <Tabs defaultValue={initialMode} className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-5">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Create Blog Post
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Choose your preferred writing workflow below:
                </p>
              </div>

              <TabsList className="grid grid-cols-2 w-full sm:w-auto h-11 p-1 bg-muted/40 border border-border/60 rounded-xl">
                <TabsTrigger value="editor" className="gap-2 text-xs font-medium rounded-lg">
                  <PenTool className="h-3.5 w-3.5" />
                  <span>Option 1: Write in Studio</span>
                </TabsTrigger>
                <TabsTrigger value="import" className="gap-2 text-xs font-medium rounded-lg">
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Option 2: Ready-Made Blog</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="editor" className="mt-0 focus-visible:outline-none">
              <PostForm />
            </TabsContent>

            <TabsContent value="import" className="mt-0 focus-visible:outline-none">
              <ReadyMadeBlogImporter />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
