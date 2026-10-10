"use client";

import React, { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { generateSlug } from "@/lib/slug";
import { compressImageClient } from "@/lib/image-compression";
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
  RotateCcw,
  ShieldCheck,
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

  // Crash Protection / Recovery State
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [localDraftInfo, setLocalDraftInfo] = useState<{
    timestamp: number;
    wordCount: number;
    title: string;
  } | null>(null);

  // Cover image
  const [coverImage, setCoverImage] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Content (Markdown or HTML)
  const [content, setContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // In-body images uploaded
  const [inBodyImages, setInBodyImages] = useState<UploadedImageItem[]>([]);
  const [isUploadingInBody, setIsUploadingInBody] = useState(false);
  const bodyImageInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop file import
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Cover Image Upload
  // Handle Cover Image Upload with Client-Side Compression
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    try {
      setIsUploadingCover(true);

      // Instant client-side compression
      const { file: compressedFile, dataUrl } = await compressImageClient(rawFile);
      if (dataUrl) {
        setCoverImage(dataUrl);
      }

      const formData = new FormData();
      formData.append("file", compressedFile);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload cover image");
      }

      const data = await res.json();
      if (data?.url) {
        setCoverImage(data.url);
        toast.success("Cover image uploaded and optimized");
      }
    } catch (err: any) {
      if (!coverImage) {
        toast.error(err.message || "Failed to upload cover image");
      } else {
        toast.info("Image compressed and attached");
      }
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Handle In-Body Images Upload with Client-Side Compression
  const handleBodyImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingInBody(true);
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const rawFile = files[i];
      try {
        const { file: compressedFile, dataUrl } = await compressImageClient(rawFile);

        const formData = new FormData();
        formData.append("file", compressedFile);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setInBodyImages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              name: rawFile.name,
              url: data.url || dataUrl,
            },
          ]);
          count++;
        } else if (dataUrl) {
          setInBodyImages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              name: rawFile.name,
              url: dataUrl,
            },
          ]);
          count++;
        }
      } catch (err) {
        console.error("Failed to upload image:", rawFile.name, err);
      }
    }

    setIsUploadingInBody(false);
    if (count > 0) {
      toast.success(`Uploaded ${count} image(s) for blog body`);
    }
  };

  // Insert image markdown tag into content at current cursor position
  const insertImageIntoContent = (url: string, name: string) => {
    const cleanName = name.replace(/\.[^/.]+$/, "");
    const markdownTag = `\n\n![${cleanName}](${url})\n\n`;

    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? content.length;
      const end = textarea.selectionEnd ?? content.length;
      const before = content.substring(0, start);
      const after = content.substring(end);
      const updated = before + markdownTag + after;
      setContent(updated);

      setTimeout(() => {
        textarea.focus();
        const cursor = start + markdownTag.length;
        textarea.setSelectionRange(cursor, cursor);
      }, 20);

      toast.success(`Inserted image at cursor: "${cleanName}"`);
    } else {
      setContent((prev) => prev + markdownTag);
      toast.success("Inserted image snippet into blog text");
    }
  };

  const copyImageMarkdownTag = (url: string, name: string) => {
    const cleanName = name.replace(/\.[^/.]+$/, "");
    const tag = `![${cleanName}](${url})`;
    navigator.clipboard.writeText(tag);
    toast.success(`Copied markdown tag for "${cleanName}"! Paste it into any section of your blog.`);
  };

  const removeBodyImage = (id: string) => {
    setInBodyImages((prev) => prev.filter((img) => img.id !== id));
    toast.info("Image removed from in-body gallery");
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

  // Check for auto-saved crash draft on mount
  React.useEffect(() => {
    try {
      const rawStored = localStorage.getItem("borkoto_blog_import_backup");
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        const hasContent = Boolean(
          (parsed.title && parsed.title.trim().length > 0) ||
          (parsed.content && parsed.content.trim().length > 0)
        );

        if (hasContent && parsed.timestamp) {
          const plainText = (parsed.content || "").replace(/<[^>]+>/g, " ").trim();
          const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
          setLocalDraftInfo({
            timestamp: parsed.timestamp,
            wordCount: words,
            title: parsed.title || "Untitled Import Draft",
          });
          setHasLocalDraft(true);
        }
      }
    } catch (err) {
      console.warn("Could not load import backup:", err);
    }
  }, []);

  // Real-time Crash Protection: Continuous local auto-backup debounced by 600ms
  React.useEffect(() => {
    if (!title.trim() && !content.trim() && !coverImage && !excerpt.trim()) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          "borkoto_blog_import_backup",
          JSON.stringify({
            title,
            slug,
            excerpt,
            content,
            coverImage,
            language,
            tags,
            inBodyImages,
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        console.warn("Could not save import backup:", err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, slug, excerpt, content, coverImage, language, tags, inBodyImages]);

  // Restore recovered crash draft
  const handleRestoreLocalDraft = () => {
    try {
      const rawStored = localStorage.getItem("borkoto_blog_import_backup");
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        if (parsed.title !== undefined) setTitle(parsed.title);
        if (parsed.slug !== undefined) setSlug(parsed.slug);
        if (parsed.excerpt !== undefined) setExcerpt(parsed.excerpt);
        if (parsed.content !== undefined) setContent(parsed.content);
        if (parsed.coverImage !== undefined) setCoverImage(parsed.coverImage);
        if (parsed.language !== undefined) setLanguage(parsed.language);
        if (parsed.tags !== undefined) setTags(parsed.tags);
        if (Array.isArray(parsed.inBodyImages)) setInBodyImages(parsed.inBodyImages);

        setHasLocalDraft(false);
        setLocalDraftInfo(null);

        const timeStr = parsed.timestamp
          ? new Date(parsed.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "previous session";
        toast.success(`Unsaved ready-made draft from ${timeStr} successfully restored!`);
      }
    } catch {
      toast.error("Failed to restore draft");
    }
  };

  // Discard local crash draft
  const handleDiscardLocalDraft = () => {
    try {
      localStorage.removeItem("borkoto_blog_import_backup");
      setHasLocalDraft(false);
      setLocalDraftInfo(null);
      toast.info("Local import session backup discarded.");
    } catch {
      setHasLocalDraft(false);
      setLocalDraftInfo(null);
    }
  };

  // Browser Unload Warning
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (title.trim() || content.trim()) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [title, content]);

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

    if (isUploadingCover) {
      toast.error("Please wait a moment for the cover image to finish uploading");
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

        const cleanPayload = JSON.parse(JSON.stringify(payload));
        const apiRes = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload),
        });

        if (!apiRes.ok) {
          const errData = await apiRes.json().catch(() => ({}));
          toast.error(errData.error || "Failed to create blog post.");
          return;
        }

        toast.success(
          targetStatus === "PUBLISHED"
            ? "Ready-made blog published successfully!"
            : "Ready-made blog saved as draft!"
        );

        // Clean up crash recovery backup upon successful save/publish
        try {
          localStorage.removeItem("borkoto_blog_import_backup");
          setHasLocalDraft(false);
          setLocalDraftInfo(null);
        } catch {}

        router.push("/admin");
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to publish blog post");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Crash Recovery Notification Banner */}
      {hasLocalDraft && localDraftInfo && (
        <div className="p-4 rounded-2xl border border-amber-300/80 bg-amber-50/90 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-200/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 shrink-0 mt-0.5 sm:mt-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm">Unsaved Ready-Made Blog Recovered</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    Crash Protection
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200/90 mt-0.5 leading-relaxed">
                  We detected an unsaved session from{" "}
                  <strong>
                    {new Date(localDraftInfo.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>{" "}
                  ({new Date(localDraftInfo.timestamp).toLocaleDateString()}) with approx{" "}
                  <strong>{localDraftInfo.wordCount} words</strong>
                  {localDraftInfo.title ? ` ("${localDraftInfo.title}")` : ""}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                size="sm"
                type="button"
                onClick={handleRestoreLocalDraft}
                className="h-8 text-xs bg-amber-800 hover:bg-amber-900 text-white font-medium shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Restore Work
              </Button>
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={handleDiscardLocalDraft}
                className="h-8 text-xs border-amber-300 dark:border-amber-800 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}

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
              Blog Title *
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
              placeholder="Brief summary of the blog for cards and SEO..."
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
                placeholder="blog-url-slug"
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

      {/* 3. In-Body Images Gallery / Tool */}
      <div className="border border-border/60 rounded-2xl p-6 bg-muted/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>In-Body Images Gallery</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload photos to place anywhere in the body of your blog. Set your cursor anywhere in the text below and click &quot;+ Insert at Cursor&quot;, or copy the markdown tag.
            </p>
          </div>

          <div>
            <input
              ref={bodyImageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleBodyImagesUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingInBody}
              onClick={() => bodyImageInputRef.current?.click()}
              className="gap-1.5 text-xs font-mono rounded-full px-3.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isUploadingInBody ? "Uploading..." : "Upload In-Body Images"}</span>
            </Button>
          </div>
        </div>

        {/* Thumbnail gallery of uploaded images */}
        {inBodyImages.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {inBodyImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative border border-border/80 rounded-xl overflow-hidden bg-background shadow-xs flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-muted/40">
                    <Image src={img.url} alt={img.name} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeBodyImage(img.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-destructive transition-colors cursor-pointer"
                      title="Remove image from gallery"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="p-2 space-y-1.5 bg-card">
                    <p className="text-[11px] font-medium text-foreground truncate" title={img.name}>
                      {img.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertImageIntoContent(img.url, img.name)}
                        className="flex-1 text-[10px] py-1 px-1.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity cursor-pointer text-center"
                        title="Insert right where your cursor is in the blog content"
                      >
                        + Insert at Cursor
                      </button>
                      <button
                        type="button"
                        onClick={() => copyImageMarkdownTag(img.url, img.name)}
                        className="p-1 rounded-md border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                        title="Copy markdown tag: ![Caption](url)"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                <strong>Tip:</strong> Click anywhere in the text box below to place your cursor, then click <strong>&quot;+ Insert at Cursor&quot;</strong> on any image above to place it in that exact section.
              </span>
            </div>
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
              className="h-7 text-xs font-mono gap-1 rounded-full px-3"
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
                      if (img) return `<img src="${img[2]}" alt="${img[1]}" class="my-4 rounded-xl max-w-full" />`;
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
            ref={contentTextareaRef}
            id="import-content"
            rows={18}
            placeholder={`Paste your ready-made blog text here...
You can use standard headings like:
## First Section
Your paragraphs and thoughts...

To insert images in different sections, set your cursor there and click "+ Insert at Cursor" above, or use:
![Image Caption](image-url)`}
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
            disabled={isPending || isUploadingCover}
            onClick={() => handleSubmit("DRAFT")}
            className="text-xs font-mono"
          >
            Save as Draft
          </Button>

          <Button
            type="button"
            disabled={isPending || isUploadingCover}
            onClick={() => handleSubmit("PUBLISHED")}
            className="text-xs font-mono gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium px-5"
          >
            {isUploadingCover ? (
              <span>Uploading cover image...</span>
            ) : (
              <>
                <span>{isPending ? "Publishing..." : "Publish Blog Now"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReadyMadeBlogImporter;
