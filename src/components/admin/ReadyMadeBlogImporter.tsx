"use client";

import React, { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { generateSlug } from "@/lib/slug";
import { createPostAction } from "@/actions/posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Copy,
  Plus,
  Eye,
  FileCode,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface UploadedImageItem {
  id: string;
  name: string;
  url: string;
}

export function ReadyMadeBlogImporter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Basic metadata
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [language, setLanguage] = useState<"EN" | "AS">("EN");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");

  // Cover image
  const [coverImage, setCoverImage] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Content (Markdown or HTML)
  const [content, setContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  // In-article images uploaded
  const [inArticleImages, setInArticleImages] = useState<UploadedImageItem[]>([]);
  const [isUploadingInArticle, setIsUploadingInArticle] = useState(false);
  const articleImageInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop file import
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Cover Image Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload cover image");
      }

      const data = await res.json();
      setCoverImage(data.url);
      toast.success("Cover image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload cover image");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Handle In-Article Images Upload
  const handleArticleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingInArticle(true);
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setInArticleImages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              name: file.name,
              url: data.url,
            },
          ]);
          count++;
        }
      } catch (err) {
        console.error("Failed to upload image:", file.name, err);
      }
    }

    setIsUploadingInArticle(false);
    if (count > 0) {
      toast.success(`Uploaded ${count} image(s) for in-article use`);
    }
  };

  // Insert image markdown tag into content
  const insertImageIntoContent = (url: string, name: string) => {
    const cleanName = name.replace(/\.[^/.]+$/, "");
    const markdownTag = `\n\n![${cleanName}](${url})\n\n`;
    setContent((prev) => prev + markdownTag);
    toast.success("Inserted image snippet into blog text");
  };

  // Handle Drop of Ready-Made Document (.md, .txt, .html)
  const handleFileProcess = async (file: File) => {
    try {
      const text = await file.text();

      // Extract title if starts with # Title
      let extractedTitle = "";
      let remainingContent = text;

      const titleMatch = text.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        extractedTitle = titleMatch[1].trim();
        // remove the first # Title from body to prevent duplicate title
        remainingContent = text.replace(/^#\s+(.+)$/m, "").trim();
      } else {
        extractedTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      }

      // Extract excerpt (first non-empty paragraph)
      const paragraphs = remainingContent.split(/\n\s*\n/).filter((p) => !p.startsWith("#") && p.trim().length > 0);
      const extractedExcerpt = paragraphs[0]?.slice(0, 200).trim() || "";

      setTitle(extractedTitle);
      setSlug(generateSlug(extractedTitle));
      setExcerpt(extractedExcerpt);
      setContent(remainingContent);

      // Check if text has Assamese characters (Unicode range U+0980 to U+09FF)
      const hasAssamese = /[\u0980-\u09FF]/.test(text);
      if (hasAssamese) {
        setLanguage("AS");
      }

      toast.success(`Successfully imported "${file.name}"!`);
    } catch (err: any) {
      toast.error("Failed to read file: " + err.message);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Submit to publish
  const handleSubmit = (targetStatus: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      toast.error("Please enter a title for the blog post");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter or paste the content for the blog post");
      return;
    }

    startTransition(async () => {
      try {
        const cleanSlug = slug.trim() || generateSlug(title);
        const cleanTags = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        // Simple markdown to HTML conversion for paragraphs, headings, blockquotes, and images
        const paragraphs = content.split(/\n\s*\n/).map((para) => {
          const trimmed = para.trim();
          if (trimmed.startsWith("### ")) {
            return `<h3>${trimmed.slice(4)}</h3>`;
          }
          if (trimmed.startsWith("## ")) {
            return `<h2>${trimmed.slice(3)}</h2>`;
          }
          if (trimmed.startsWith("# ")) {
            return `<h1>${trimmed.slice(2)}</h1>`;
          }
          if (trimmed.startsWith("> ")) {
            return `<blockquote><p>${trimmed.slice(2)}</p></blockquote>`;
          }
          const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (imgMatch) {
            return `<figure><img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="my-4 rounded-lg max-w-full h-auto" /><figcaption class="text-xs text-center text-muted-foreground mt-1">${imgMatch[1]}</figcaption></figure>`;
          }
          return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
        });

        const contentHtml = paragraphs.join("\n");

        const payload = {
          title: title.trim(),
          slug: cleanSlug,
          excerpt: excerpt.trim() || null,
          coverImage: coverImage.trim() || null,
          content: { type: "doc", content: [] },
          contentHtml,
          language,
          status: targetStatus,
          publishedAt: targetStatus === "PUBLISHED" ? new Date().toISOString() : null,
          tags: cleanTags,
        };

        const result = await createPostAction(payload);
        toast.success(
          targetStatus === "PUBLISHED"
            ? "Ready-made blog published successfully!"
            : "Ready-made blog saved as draft!"
        );
        router.push("/admin");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to publish blog post");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* 1. File Dropzone & Import Assistant */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer rounded-2xl ${
          isDraggingFile
            ? "border-primary bg-primary/5"
            : "border-border/70 bg-muted/20 hover:border-foreground/40 hover:bg-muted/30"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,.html"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border border-border shadow-xs">
            <UploadCloud className="h-6 w-6 text-foreground/80" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Drop your ready-made blog file here (.md, .txt, .html)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse from your computer. Title, excerpt, and text will be extracted automatically.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Metadata: Title, Language, Slug, Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="import-title" className="text-sm font-semibold">
              Article Title *
            </Label>
            <Input
              id="import-title"
              placeholder="e.g. Cooperative Games on Network Topologies"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug) setSlug(generateSlug(e.target.value));
              }}
              className="text-base sm:text-lg font-medium py-2.5"
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="import-excerpt" className="text-sm font-semibold">
              Short Summary / Excerpt
            </Label>
            <Textarea
              id="import-excerpt"
              rows={2}
              placeholder="Brief summary of the article for blog cards and SEO..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="text-sm leading-relaxed"
            />
          </div>

          {/* Slug & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-slug" className="text-xs font-mono text-muted-foreground">
                URL Slug (/blog/...)
              </Label>
              <Input
                id="import-slug"
                placeholder="article-url-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="import-tags" className="text-xs font-mono text-muted-foreground">
                Tags (comma separated)
              </Label>
              <Input
                id="import-tags"
                placeholder="Game Theory, Mathematics, Networks"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Settings: Language, Status, Cover */}
        <div className="space-y-6 lg:col-span-4">
          {/* Language Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Language</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLanguage("EN")}
                className={`flex-1 py-2 text-xs font-mono rounded-lg border transition-all ${
                  language === "EN"
                    ? "bg-foreground text-background font-semibold border-foreground"
                    : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("AS")}
                className={`flex-1 py-2 text-xs font-assamese rounded-lg border transition-all ${
                  language === "AS"
                    ? "bg-foreground text-background font-semibold border-foreground"
                    : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                অসমীয়া (Assamese)
              </button>
            </div>
          </div>

          {/* Cover Image Uploader */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Cover Image</Label>
              {coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />

            {coverImage ? (
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border group">
                <Image
                  src={coverImage}
                  alt="Cover Image"
                  fill
                  unoptimized={Boolean(coverImage?.startsWith("data:"))}
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-mono transition-opacity"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div
                onClick={() => coverInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border border-dashed border-border/80 rounded-xl bg-muted/20 hover:border-foreground/40 hover:bg-muted/30 cursor-pointer transition-all"
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground/60 mb-1.5" />
                <span className="text-xs font-medium text-foreground">Upload Cover Image</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG, WebP up to 5MB</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. In-Article Images Drawer / Tool */}
      <div className="border border-border/60 rounded-2xl p-6 bg-muted/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>In-Article Images Tool</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload images belonging inside the body of the blog, then click "Insert" to place them anywhere in the text.
            </p>
          </div>

          <div>
            <input
              ref={articleImageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleArticleImagesUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingInArticle}
              onClick={() => articleImageInputRef.current?.click()}
              className="gap-1.5 text-xs font-mono"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isUploadingInArticle ? "Uploading..." : "Upload In-Body Images"}</span>
            </Button>
          </div>
        </div>

        {/* Thumbnail gallery of uploaded images */}
        {inArticleImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            {inArticleImages.map((img) => (
              <div key={img.id} className="group relative border border-border rounded-lg overflow-hidden bg-background">
                <div className="relative aspect-video w-full">
                  <Image src={img.url} alt={img.name} fill className="object-cover" />
                </div>
                <div className="p-1.5 text-center bg-card">
                  <button
                    type="button"
                    onClick={() => insertImageIntoContent(img.url, img.name)}
                    className="w-full text-[10px] font-mono py-1 rounded bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
                  >
                    + Insert
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Blog Content Paste & Edit Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="import-content" className="text-sm font-semibold flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            <span>Blog Content (Markdown / Formatted Text) *</span>
          </Label>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="h-7 text-xs font-mono gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{previewMode ? "Edit Raw" : "Live Preview"}</span>
            </Button>
          </div>
        </div>

        {previewMode ? (
          <div className="min-h-[400px] p-6 rounded-2xl border border-border/80 bg-background prose max-w-none">
            {content ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: content
                    .split(/\n\s*\n/)
                    .map((p) => {
                      if (p.startsWith("### ")) return `<h3>${p.slice(4)}</h3>`;
                      if (p.startsWith("## ")) return `<h2>${p.slice(3)}</h2>`;
                      if (p.startsWith("# ")) return `<h1>${p.slice(2)}</h1>`;
                      const img = p.match(/^!\[(.*?)\]\((.*?)\)$/);
                      if (img) return `<img src="${img[2]}" alt="${img[1]}" class="my-4 rounded-lg" />`;
                      return `<p>${p.replace(/\n/g, "<br/>")}</p>`;
                    })
                    .join(""),
                }}
              />
            ) : (
              <p className="text-muted-foreground text-sm italic">Nothing to preview yet. Paste content below.</p>
            )}
          </div>
        ) : (
          <Textarea
            id="import-content"
            rows={18}
            placeholder={`Paste your ready-made blog text here...
You can use standard headings like:
## First Section
Your paragraphs and thoughts...

To insert images, use:
![Image Caption](image-url)
(Or upload using the In-Article Images tool above)`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-sm leading-relaxed p-4 rounded-2xl border-border/80"
          />
        )}
      </div>

      {/* 5. Sticky Publish & Save Action Bar */}
      <div className="sticky bottom-6 z-30 flex items-center justify-between p-4 bg-background/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-lg">
        <div className="text-xs font-mono text-muted-foreground">
          {content.trim() ? `${content.trim().split(/\s+/).length} words` : "0 words"}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleSubmit("DRAFT")}
            className="text-xs font-mono"
          >
            Save as Draft
          </Button>

          <Button
            type="button"
            disabled={isPending}
            onClick={() => handleSubmit("PUBLISHED")}
            className="text-xs font-mono gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium px-5"
          >
            <span>{isPending ? "Publishing..." : "Publish Blog Now"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReadyMadeBlogImporter;
