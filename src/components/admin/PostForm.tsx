"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSlug } from "@/lib/slug";
import { transliterateTextToAssamese } from "@/lib/assamese-translit";
import { PostInput } from "@/lib/validations";
import { LanguageCode, SUPPORTED_LANGUAGES } from "@/lib/languages";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { PostContent } from "@/components/blog/PostContent";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RefreshCw,
  Upload,
  Eye,
  PenTool,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Columns2,
  SlidersHorizontal,
  X,
  Languages,
} from "lucide-react";
import { toast } from "sonner";
import { createPostAction, updatePostAction } from "@/actions/posts";
import Image from "next/image";
import Link from "next/link";
import { EditorStats } from "@/components/editor/TiptapEditor";

interface PostFormProps {
  initialData?: {
    id?: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
    content: object;
    contentHtml: string;
    language: "EN" | "AS";
    status: "DRAFT" | "PUBLISHED";
    publishedAt?: Date | string | null;
    tags?: { id?: string; name: string }[];
  };
}

export function PostForm({ initialData }: PostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!initialData?.id;

  // Full Screen studio states
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState<"write" | "split" | "preview">("write");
  const [canvasWidth, setCanvasWidth] = useState<"standard" | "comfortable" | "wide">("comfortable");
  const [fontSize, setFontSize] = useState<"normal" | "comfortable" | "spacious">("comfortable");
  const [isZenMode, setIsZenMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editorStats, setEditorStats] = useState<EditorStats>({
    words: 0,
    chars: 0,
    readingTime: 1,
    paragraphs: 0,
  });
  const [hasLocalDraft, setHasLocalDraft] = useState(false);

  // Form States
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!initialData?.slug);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [language, setLanguage] = useState<LanguageCode>(
    (initialData?.language as LanguageCode) || "EN"
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    initialData?.status || "DRAFT"
  );
  const [tagInput, setTagInput] = useState(
    initialData?.tags?.map((t) => t.name).join(", ") || ""
  );

  // Editor content state
  const [contentJson, setContentJson] = useState<object>(
    initialData?.content || { type: "doc", content: [] }
  );
  const [contentHtml, setContentHtml] = useState<string>(
    initialData?.contentHtml || ""
  );

  // Autosave status state
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Cover image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Auto-generate slug when title changes (if not manually overridden)
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(newTitle));
    }
    setSaveStatus("unsaved");
  };

  const handleRegenerateSlug = () => {
    const generated = generateSlug(title);
    setSlug(generated);
    setIsSlugManuallyEdited(false);
    toast.info(`Generated slug: ${generated}`);
  };

  // Cover image file change handler
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
      setSaveStatus("unsaved");
      toast.success("Cover image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cover upload failed");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Editor Change handler
  const handleEditorChange = ({ json, html }: { json: object; html: string }) => {
    setContentJson(json);
    setContentHtml(html);
    setSaveStatus("unsaved");
  };

  // Prepare submission data payload
  const buildPayload = (targetStatus?: "DRAFT" | "PUBLISHED"): PostInput => {
    const cleanTags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      title,
      slug: slug || generateSlug(title),
      excerpt: excerpt.trim() || null,
      coverImage: coverImage.trim() || null,
      content: contentJson,
      contentHtml: contentHtml,
      language,
      status: targetStatus || status,
      publishedAt:
        (targetStatus || status) === "PUBLISHED"
          ? initialData?.publishedAt || new Date().toISOString()
          : null,
      tags: cleanTags,
    };
  };

  // Manual save handler
  const handleSubmit = async (targetStatus: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      toast.error("Please enter a title for the post");
      return;
    }

    startTransition(async () => {
      try {
        setSaveStatus("saving");
        const payload = buildPayload(targetStatus);

        if (isEditing && initialData?.id) {
          await updatePostAction(initialData.id, payload);
          toast.success(
            targetStatus === "PUBLISHED"
              ? "Post updated and published!"
              : "Draft updated successfully!"
          );
        } else {
          const result = await createPostAction(payload);
          toast.success(
            targetStatus === "PUBLISHED"
              ? "Post published successfully!"
              : "Draft saved successfully!"
          );
          router.push(`/admin/posts/${result.id}/edit`);
        }
        setStatus(targetStatus);
        setSaveStatus("saved");
        router.refresh();
      } catch (err) {
        setSaveStatus("unsaved");
        toast.error(err instanceof Error ? err.message : "Failed to save post");
      }
    });
  };

  // Debounced Autosave for Drafts (when editing an existing post)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isEditing || !initialData?.id || status === "PUBLISHED") {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      if (!title.trim()) return;

      try {
        setSaveStatus("saving");
        const payload = buildPayload("DRAFT");
        await updatePostAction(initialData.id!, payload);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 3000); // 3-second debounce

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, excerpt, coverImage, language, contentHtml, tagInput]);

  // Check for local storage auto-saved draft
  useEffect(() => {
    const backupKey = `prof_blog_backup_${initialData?.id || "new"}`;
    try {
      const stored = localStorage.getItem(backupKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.timestamp && !title && !contentHtml && (parsed.title || parsed.contentHtml)) {
          setHasLocalDraft(true);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-backup to localStorage
  useEffect(() => {
    if (!title && !contentHtml) return;
    const backupKey = `prof_blog_backup_${initialData?.id || "new"}`;
    try {
      localStorage.setItem(
        backupKey,
        JSON.stringify({
          title,
          slug,
          excerpt,
          coverImage,
          language,
          tagInput,
          contentHtml,
          contentJson,
          timestamp: Date.now(),
        })
      );
    } catch {}
  }, [title, slug, excerpt, coverImage, language, tagInput, contentHtml, contentJson, initialData?.id]);

  const handleRestoreLocalDraft = () => {
    const backupKey = `prof_blog_backup_${initialData?.id || "new"}`;
    try {
      const stored = localStorage.getItem(backupKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.slug) setSlug(parsed.slug);
        if (parsed.excerpt) setExcerpt(parsed.excerpt);
        if (parsed.coverImage) setCoverImage(parsed.coverImage);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.tagInput) setTagInput(parsed.tagInput);
        if (parsed.contentHtml) setContentHtml(parsed.contentHtml);
        if (parsed.contentJson) setContentJson(parsed.contentJson);
        setHasLocalDraft(false);
        toast.success("Auto-saved local draft restored!");
      }
    } catch {
      toast.error("Failed to restore draft");
    }
  };

  // Keyboard shortcuts (Escape for full screen, Cmd/Ctrl+S for save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        setIsFullScreen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit("DRAFT");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen, isSettingsOpen, title, slug, excerpt, coverImage, language, contentHtml, contentJson, tagInput]);

  const getCanvasWidthClass = () => {
    switch (canvasWidth) {
      case "standard":
        return "max-w-3xl";
      case "comfortable":
        return "max-w-4xl";
      case "wide":
        return "max-w-5xl";
      default:
        return "max-w-4xl";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-9 w-9"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              {isEditing ? "Edit Post" : "Create New Post"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  All changes saved
                </span>
              )}
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Saving draft...
                </span>
              )}
              {saveStatus === "unsaved" && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit("DRAFT")}
            disabled={isPending}
          >
            Save Draft
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit("PUBLISHED")}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {status === "PUBLISHED" ? "Update Published Post" : "Publish Post"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content (2 columns) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Assamese Active Information Banner */}
          {language === "AS" && (
            <div className="flex items-center justify-between rounded-none border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-none bg-primary animate-pulse" />
                <span className="font-semibold text-primary font-assamese text-sm">
                  অসমীয়া লিখন প্ৰণালী সক্ৰিয় (Assamese Writing Mode)
                </span>
                <span className="text-muted-foreground hidden sm:inline">
                  — Type English phonetically and press Space, or use the in-editor keyboard.
                </span>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                SMES / AS
              </Badge>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-title" className="text-sm font-semibold">
                Post Title *
              </Label>
              {language === "AS" && title && /[a-zA-Z]/.test(title) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const converted = transliterateTextToAssamese(title);
                    handleTitleChange(converted);
                    toast.success("Converted title to Assamese");
                  }}
                  className="h-6 text-xs text-primary gap-1"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>Convert Title to অসমীয়া</span>
                </Button>
              )}
            </div>
            <Input
              id="post-title"
              placeholder={
                language === "AS"
                  ? "শীৰ্ষক ইয়াত লিখক... (e.g. 'Aaji bhal din')"
                  : "Enter a compelling title..."
              }
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (language === "AS" && e.key === " ") {
                  // If ends with English word, convert on space
                  const match = title.match(/([a-zA-Z]+)$/);
                  if (match) {
                    const converted = transliterateTextToAssamese(title);
                    if (converted !== title) {
                      setTitle(converted + " ");
                      if (!isSlugManuallyEdited) {
                        setSlug(generateSlug(converted));
                      }
                    }
                  }
                }
              }}
              className={`text-lg sm:text-xl font-bold py-5 ${
                language === "AS" ? "font-assamese" : ""
              }`}
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-slug" className="text-xs text-muted-foreground">
                URL Slug (auto-transliterated for Assamese)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleRegenerateSlug}
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            </div>
            <div className="flex items-center rounded-none border border-input bg-muted/30 px-3">
              <span className="text-xs text-muted-foreground font-mono">/blog/</span>
              <input
                id="post-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManuallyEdited(true);
                  setSaveStatus("unsaved");
                }}
                className="w-full bg-transparent py-2 px-1 text-xs font-mono focus:outline-none"
                placeholder="post-url-slug"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-excerpt" className="text-sm font-semibold">
                Short Excerpt / Summary
              </Label>
              {language === "AS" && excerpt && /[a-zA-Z]/.test(excerpt) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const converted = transliterateTextToAssamese(excerpt);
                    setExcerpt(converted);
                    setSaveStatus("unsaved");
                    toast.success("Converted excerpt to Assamese");
                  }}
                  className="h-6 text-xs text-primary gap-1"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>Convert Excerpt to অসমীয়া</span>
                </Button>
              )}
            </div>
            <Textarea
              id="post-excerpt"
              rows={2}
              placeholder="A brief summary for previews, search results, and social cards..."
              value={excerpt}
              onChange={(e) => {
                setExcerpt(e.target.value);
                setSaveStatus("unsaved");
              }}
              onKeyDown={(e) => {
                if (language === "AS" && e.key === " ") {
                  const match = excerpt.match(/([a-zA-Z]+)$/);
                  if (match) {
                    const converted = transliterateTextToAssamese(excerpt);
                    if (converted !== excerpt) {
                      setExcerpt(converted + " ");
                    }
                  }
                }
              }}
              className={language === "AS" ? "font-assamese" : ""}
            />
          </div>

          {/* Editor & Live Preview Tabs */}
          <div className="space-y-2">
            <Tabs defaultValue="write" className="w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <Label className="text-sm font-semibold">Content</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullScreen(true)}
                    className="h-8 text-xs font-mono gap-1.5"
                    title="Open Full-Screen Studio"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Fullscreen Studio</span>
                  </Button>
                  <TabsList className="h-8">
                    <TabsTrigger value="write" className="text-xs gap-1.5">
                      <PenTool className="h-3.5 w-3.5" />
                      Write
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Live Preview
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="write" className="mt-4 focus-visible:outline-none">
                <TiptapEditor
                  initialContent={initialData?.content}
                  language={language}
                  onChange={handleEditorChange}
                  isFullScreen={false}
                  onToggleFullScreen={() => setIsFullScreen(true)}
                  fontSize={fontSize}
                  onStatsChange={(stats) => setEditorStats(stats)}
                  placeholder={
                    language === "AS"
                      ? "অসমীয়াত নিজৰ মনৰ কথা লিখক..."
                      : "Write your article using headings, images, lists, and formatting..."
                  }
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-4 focus-visible:outline-none">
                <Card>
                  <CardHeader className="border-b bg-muted/20">
                    <CardTitle
                      className={`text-2xl ${
                        language === "AS" ? "font-assamese" : "font-heading"
                      }`}
                    >
                      {title || "Untitled Post Preview"}
                    </CardTitle>
                    {excerpt && (
                      <CardDescription
                        className={`text-base ${
                          language === "AS" ? "font-assamese" : ""
                        }`}
                      >
                        {excerpt}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6">
                    {contentHtml ? (
                      <PostContent
                        contentHtml={contentHtml}
                        language={language}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No content written yet. Switch to the Write tab to begin.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar Settings (1 column) */}
        <div className="space-y-6">
          {/* Publishing Settings Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Publishing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label htmlFor="post-language">Language</Label>
                <Select
                  value={language}
                  onValueChange={(val) => {
                    if (val === "EN" || val === "AS") {
                      setLanguage(val);
                      setSaveStatus("unsaved");
                    }
                  }}
                >
                  <SelectTrigger id="post-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.label} ({lang.nativeName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Loads the Noto Sans Bengali font and sets the HTML lang tag accordingly.
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="post-status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) => {
                    if (val === "DRAFT" || val === "PUBLISHED") {
                      setStatus(val);
                      setSaveStatus("unsaved");
                    }
                  }}
                >
                  <SelectTrigger id="post-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft (Hidden from public)</SelectItem>
                    <SelectItem value="PUBLISHED">Published (Public)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="post-tags">Tags (comma separated)</Label>
                <Input
                  id="post-tags"
                  placeholder="Technology, Philosophy, অসমীয়া"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setSaveStatus("unsaved");
                  }}
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {tagInput
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px]">
                        #{tag}
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Image Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleCoverUpload}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 border-dashed h-16"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCover}
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">
                  {isUploadingCover ? "Uploading..." : "Upload cover image"}
                </span>
              </Button>

              <div className="space-y-1">
                <Label htmlFor="cover-url" className="text-xs text-muted-foreground">
                  Or enter image URL
                </Label>
                <Input
                  id="cover-url"
                  placeholder="https://..."
                  value={coverImage}
                  onChange={(e) => {
                    setCoverImage(e.target.value);
                    setSaveStatus("unsaved");
                  }}
                  className="text-xs"
                />
              </div>

              {coverImage && (
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-none border bg-muted">
                  <Image
                    src={coverImage}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 px-2 text-xs"
                    onClick={() => {
                      setCoverImage("");
                      setSaveStatus("unsaved");
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full-Screen Writing Studio Overlay */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto flex flex-col font-sans selection:bg-primary/20">
          {/* Studio Top Navigation Bar */}
          <header
            className={cn(
              "sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-md px-3 sm:px-6 shrink-0 transition-opacity duration-300",
              isZenMode && "opacity-25 hover:opacity-100 focus-within:opacity-100"
            )}
          >
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsFullScreen(false)}
                className="h-8 gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground"
                title="Exit Fullscreen (Esc)"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exit (Esc)</span>
              </Button>

              <div className="h-4 w-px bg-border hidden sm:block" />

              {/* Language Segmented Toggle */}
              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("EN");
                    setSaveStatus("unsaved");
                  }}
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-md transition-all",
                    language === "EN"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Switch to English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("AS");
                    setSaveStatus("unsaved");
                  }}
                  className={cn(
                    "px-2 py-0.5 text-xs font-assamese rounded-md transition-all",
                    language === "AS"
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="অসমীয়া ভাষালৈ পৰিৱৰ্তন কৰক (SMS কিবৰ্ড সক্ৰিয়)"
                >
                  অসমীয়া
                </button>
              </div>

              {/* Save Status Badge */}
              <div className="hidden md:flex items-center gap-1.5 text-xs font-mono">
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Saved</span>
                  </span>
                )}
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </span>
                )}
                {saveStatus === "unsaved" && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Unsaved</span>
                  </span>
                )}
              </div>
            </div>

            {/* Center Section: View Mode Switcher */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("write")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                  viewMode === "write"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Focused Writing Studio Canvas"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Write</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                  viewMode === "split"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Split View: Editor & Live Reader Preview side-by-side"
              >
                <Columns2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                  viewMode === "preview"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Full Reader Article Preview"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>

            {/* Right Section: Stats, Width, Font, Settings, Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Reading Stats */}
              <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
                <span>{editorStats.words.toLocaleString()} words</span>
                <span>&bull;</span>
                <span>{editorStats.readingTime} min read</span>
              </div>

              {/* Canvas Width Selector */}
              <div className="hidden xl:flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setCanvasWidth("standard")}
                  className={cn(
                    "px-2 py-0.5 rounded-md transition-all",
                    canvasWidth === "standard"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Standard Writing Width (768px)"
                >
                  Std
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasWidth("comfortable")}
                  className={cn(
                    "px-2 py-0.5 rounded-md transition-all",
                    canvasWidth === "comfortable"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Comfortable Writing Width (896px)"
                >
                  Comfort
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasWidth("wide")}
                  className={cn(
                    "px-2 py-0.5 rounded-md transition-all",
                    canvasWidth === "wide"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Wide Writing Width (1024px)"
                >
                  Wide
                </button>
              </div>

              {/* Font Size Selector */}
              <div className="hidden sm:flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => setFontSize("normal")}
                  className={cn(
                    "px-1.5 py-0.5 rounded-md transition-all font-mono",
                    fontSize === "normal"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Standard Font Size"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("comfortable")}
                  className={cn(
                    "px-1.5 py-0.5 rounded-md transition-all font-mono",
                    fontSize === "comfortable"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Comfortable Font Size"
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("spacious")}
                  className={cn(
                    "px-1.5 py-0.5 rounded-md transition-all font-mono",
                    fontSize === "spacious"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Spacious Font Size"
                >
                  A++
                </button>
              </div>

              {/* Zen Mode Toggle */}
              <Button
                type="button"
                variant={isZenMode ? "secondary" : "ghost"}
                size="icon"
                onClick={() => {
                  setIsZenMode(!isZenMode);
                  toast.info(isZenMode ? "Zen mode disabled" : "Zen mode enabled (UI dims for focus)");
                }}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title={isZenMode ? "Exit Zen Mode" : "Distraction-Free Zen Mode"}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              </Button>

              {/* Post Settings Drawer Trigger */}
              <Button
                type="button"
                variant={isSettingsOpen ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="h-8 gap-1.5 text-xs font-medium"
                title="Post Metadata, Cover Image & Tags Settings"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Settings</span>
                {coverImage && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </Button>

              {/* Save Draft */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleSubmit("DRAFT")}
                className="h-8 text-xs font-mono hidden sm:inline-flex"
                title="Save Draft (⌘S)"
              >
                Save Draft
              </Button>

              {/* Publish Post */}
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => handleSubmit("PUBLISHED")}
                className="h-8 text-xs font-medium px-3 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                <span>{status === "PUBLISHED" ? "Update" : "Publish"}</span>
              </Button>
            </div>
          </header>

          {/* VIEW MODE 1: FOCUSED WRITING CANVAS */}
          {viewMode === "write" && (
            <main
              className={cn(
                "flex-1 w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-80 transition-all",
                getCanvasWidthClass()
              )}
            >
              {/* Local Draft Recovery Notification */}
              {hasLocalDraft && (
                <div className="mb-6 flex items-center justify-between p-3.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>An auto-saved draft from an earlier session was recovered in your browser.</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs bg-amber-700 hover:bg-amber-800 text-white"
                      onClick={handleRestoreLocalDraft}
                    >
                      Restore Draft
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setHasLocalDraft(false)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}

              {/* Cover Image Banner (if set) or quick-add button */}
              {coverImage ? (
                <div className="group relative mb-8 aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden rounded-xl border border-border/80 bg-muted shadow-xs">
                  <Image src={coverImage} alt="Cover preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 text-xs font-mono"
                    >
                      Change Cover Image
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setCoverImage("");
                        setSaveStatus("unsaved");
                      }}
                      className="h-8 text-xs font-mono"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-lg hover:bg-muted/60 border border-border/40 hover:border-border"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>+ Add Cover Image</span>
                  </button>

                  {language === "AS" && (
                    <span className="text-[11px] font-assamese text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-medium">
                      অসমীয়া লিখন সক্ৰিয় (SMS Keyboard ON)
                    </span>
                  )}
                </div>
              )}

              {/* Title & Subtitle in Canvas */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start justify-between gap-4">
                  <input
                    type="text"
                    placeholder={language === "AS" ? "শীৰ্ষক ইয়াত লিখক..." : "Post Title..."}
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (language === "AS" && e.key === " ") {
                        const match = title.match(/([a-zA-Z]+)$/);
                        if (match) {
                          const converted = transliterateTextToAssamese(title);
                          if (converted !== title) {
                            setTitle(converted + " ");
                            if (!isSlugManuallyEdited) {
                              setSlug(generateSlug(converted));
                            }
                          }
                        }
                      }
                    }}
                    className={cn(
                      "w-full bg-transparent text-3xl sm:text-5xl font-heading font-bold tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:outline-none border-0 p-0",
                      language === "AS" ? "font-assamese leading-tight" : "leading-tight"
                    )}
                  />
                  {language === "AS" && title && /[a-zA-Z]/.test(title) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const converted = transliterateTextToAssamese(title);
                        handleTitleChange(converted);
                        toast.success("Title converted to Assamese");
                      }}
                      className="h-7 text-xs text-primary gap-1 shrink-0 bg-primary/5 hover:bg-primary/10 border border-primary/20"
                    >
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>অসমীয়া কৰক</span>
                    </Button>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <input
                    type="text"
                    placeholder="Add a subtitle or brief summary (optional)..."
                    value={excerpt}
                    onChange={(e) => {
                      setExcerpt(e.target.value);
                      setSaveStatus("unsaved");
                    }}
                    onKeyDown={(e) => {
                      if (language === "AS" && e.key === " ") {
                        const match = excerpt.match(/([a-zA-Z]+)$/);
                        if (match) {
                          const converted = transliterateTextToAssamese(excerpt);
                          if (converted !== excerpt) {
                            setExcerpt(converted + " ");
                          }
                        }
                      }
                    }}
                    className={cn(
                      "w-full bg-transparent text-lg sm:text-xl text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none border-0 p-0",
                      language === "AS" ? "font-assamese" : ""
                    )}
                  />
                  {language === "AS" && excerpt && /[a-zA-Z]/.test(excerpt) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const converted = transliterateTextToAssamese(excerpt);
                        setExcerpt(converted);
                        toast.success("Subtitle converted to Assamese");
                      }}
                      className="h-6 text-[11px] text-primary gap-1 shrink-0"
                    >
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>অসমীয়া কৰক</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Full-Screen Tiptap Editor */}
              <div className="pt-2">
                <TiptapEditor
                  initialContent={initialData?.content}
                  language={language}
                  onChange={handleEditorChange}
                  isFullScreen={true}
                  onToggleFullScreen={() => setIsFullScreen(false)}
                  fontSize={fontSize}
                  onStatsChange={(stats) => setEditorStats(stats)}
                  placeholder={
                    language === "AS"
                      ? "অসমীয়াত নিজৰ চিন্তা, গৱেষণা বা মতামত লিখক... (SMS কিবৰ্ড সক্ৰিয়: 'axom', 'namaskar' টাইপ কৰি Space টিপক)"
                      : "Start writing your article with headings, quotes, lists, images, and formatting..."
                  }
                />
              </div>
            </main>
          )}

          {/* VIEW MODE 2: SPLIT VIEW (EDITOR + LIVE READER PREVIEW SIDE-BY-SIDE) */}
          {viewMode === "split" && (
            <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 pb-80">
              {/* Left Column: Writing Canvas */}
              <div className="space-y-4 border-r-0 lg:border-r border-border/60 lg:pr-8">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Editor Canvas
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {editorStats.words.toLocaleString()} words
                  </span>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={language === "AS" ? "শীৰ্ষক ইয়াত লিখক..." : "Post Title..."}
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className={cn(
                      "w-full bg-transparent text-2xl sm:text-3xl font-heading font-bold text-foreground focus:outline-none",
                      language === "AS" && "font-assamese"
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Subtitle or excerpt..."
                    value={excerpt}
                    onChange={(e) => {
                      setExcerpt(e.target.value);
                      setSaveStatus("unsaved");
                    }}
                    className={cn(
                      "w-full bg-transparent text-sm sm:text-base text-muted-foreground focus:outline-none",
                      language === "AS" && "font-assamese"
                    )}
                  />
                </div>

                <TiptapEditor
                  initialContent={initialData?.content}
                  language={language}
                  onChange={handleEditorChange}
                  isFullScreen={true}
                  onToggleFullScreen={() => setIsFullScreen(false)}
                  fontSize={fontSize}
                  onStatsChange={(stats) => setEditorStats(stats)}
                />
              </div>

              {/* Right Column: Live Reader Preview */}
              <div className="space-y-6 lg:pl-4 overflow-y-auto max-h-[calc(100vh-120px)] sticky top-20">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Live Reader Preview</span>
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    Updates in real time
                  </span>
                </div>

                {/* Reader Card */}
                <article className="rounded-xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
                  {coverImage && (
                    <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg bg-muted">
                      <Image src={coverImage} alt="Cover preview" fill className="object-cover" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <h1
                      className={cn(
                        "text-2xl sm:text-4xl font-heading font-bold text-foreground tracking-tight",
                        language === "AS" && "font-assamese"
                      )}
                    >
                      {title || "Untitled Article"}
                    </h1>
                    {excerpt && (
                      <p
                        className={cn(
                          "text-base text-muted-foreground leading-relaxed",
                          language === "AS" && "font-assamese"
                        )}
                      >
                        {excerpt}
                      </p>
                    )}
                  </div>

                  {/* Author badge */}
                  <div className="flex items-center gap-3 pt-3 border-t border-border/40 text-xs text-muted-foreground font-mono">
                    <span className="font-semibold text-foreground">Prof. Surajit Borkotokey</span>
                    <span>&bull;</span>
                    <span>{editorStats.readingTime} min read</span>
                    <span>&bull;</span>
                    <span>
                      {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Rendered HTML */}
                  <div className="pt-4 border-t border-border/40">
                    {contentHtml ? (
                      <PostContent contentHtml={contentHtml} language={language} />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Start writing in the editor on the left to see your live article render here...
                      </p>
                    )}
                  </div>
                </article>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: FULL READER PREVIEW */}
          {viewMode === "preview" && (
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8 pb-80">
              <article className="rounded-2xl border border-border/80 bg-card p-6 sm:p-12 space-y-8 shadow-xs">
                {coverImage && (
                  <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl bg-muted">
                    <Image src={coverImage} alt="Cover preview" fill className="object-cover" />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {language === "AS" ? "অসমীয়া (AS)" : "English (EN)"}
                    </Badge>
                    {status === "PUBLISHED" ? (
                      <Badge className="bg-emerald-600 text-white text-xs">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Draft</Badge>
                    )}
                  </div>

                  <h1
                    className={cn(
                      "text-3xl sm:text-5xl font-heading font-bold text-foreground tracking-tight",
                      language === "AS" && "font-assamese"
                    )}
                  >
                    {title || "Untitled Article"}
                  </h1>

                  {excerpt && (
                    <p
                      className={cn(
                        "text-lg sm:text-xl text-muted-foreground leading-relaxed",
                        language === "AS" && "font-assamese"
                      )}
                    >
                      {excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-border/40 text-xs text-muted-foreground font-mono">
                    <span className="font-semibold text-foreground">Prof. Surajit Borkotokey</span>
                    <span>&bull;</span>
                    <span>{editorStats.words.toLocaleString()} words</span>
                    <span>&bull;</span>
                    <span>{editorStats.readingTime} min read</span>
                    <span>&bull;</span>
                    <span>
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/40">
                  {contentHtml ? (
                    <PostContent contentHtml={contentHtml} language={language} />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No content written yet. Switch to the Write tab to begin.
                    </p>
                  )}
                </div>
              </article>
            </main>
          )}

          {/* Slide-over Post Settings Drawer (Inside Fullscreen) */}
          {isSettingsOpen && (
            <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-card border-l border-border shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-base text-foreground">Post Settings</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSettingsOpen(false)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Cover Image Settings */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">Cover Image</Label>
                  {coverImage ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
                      <Image src={coverImage} alt="Cover preview" fill className="object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-7 px-2 text-xs"
                        onClick={() => {
                          setCoverImage("");
                          setSaveStatus("unsaved");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-dashed h-14"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingCover}
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">
                      {isUploadingCover ? "Uploading..." : "Upload Cover Image"}
                    </span>
                  </Button>

                  <div className="space-y-1">
                    <Label htmlFor="drawer-cover-url" className="text-[11px] text-muted-foreground">
                      Or paste image URL
                    </Label>
                    <Input
                      id="drawer-cover-url"
                      placeholder="https://images.unsplash.com/..."
                      value={coverImage}
                      onChange={(e) => {
                        setCoverImage(e.target.value);
                        setSaveStatus("unsaved");
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Article Language</Label>
                  <Select
                    value={language}
                    onValueChange={(val) => {
                      if (val === "EN" || val === "AS") {
                        setLanguage(val);
                        setSaveStatus("unsaved");
                      }
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN">English (EN)</SelectItem>
                      <SelectItem value="AS">অসমীয়া (Assamese)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* URL Slug */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="drawer-slug" className="text-xs font-semibold">URL Slug</Label>
                    <button
                      type="button"
                      onClick={handleRegenerateSlug}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Auto-generate
                    </button>
                  </div>
                  <div className="flex items-center rounded-md border border-input bg-muted/30 px-2.5">
                    <span className="text-xs text-muted-foreground font-mono">/blog/</span>
                    <input
                      id="drawer-slug"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setIsSlugManuallyEdited(true);
                        setSaveStatus("unsaved");
                      }}
                      className="w-full bg-transparent py-2 px-1 text-xs font-mono focus:outline-none"
                      placeholder="post-slug"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="drawer-tags" className="text-xs font-semibold">Tags (comma-separated)</Label>
                  <Input
                    id="drawer-tags"
                    placeholder="Mathematics, Research, অসমীয়া"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setSaveStatus("unsaved");
                    }}
                    className="text-xs"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tagInput
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px]">
                          #{tag}
                        </Badge>
                      ))}
                  </div>
                </div>

                {/* Publishing Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Post Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val) => {
                      if (val === "DRAFT" || val === "PUBLISHED") {
                        setStatus(val);
                        setSaveStatus("unsaved");
                      }
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft (Unpublished)</SelectItem>
                      <SelectItem value="PUBLISHED">Published (Public)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-6 border-t border-border mt-6">
                <Button
                  type="button"
                  className="w-full text-xs"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  Done / Close Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
