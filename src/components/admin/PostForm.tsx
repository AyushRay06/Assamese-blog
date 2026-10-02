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
} from "lucide-react";
import { toast } from "sonner";
import { createPostAction, updatePostAction } from "@/actions/posts";
import Image from "next/image";
import Link from "next/link";

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
  }, [title, slug, excerpt, coverImage, language, contentHtml, tagInput]);

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
            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
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
            <div className="flex items-center rounded-md border bg-muted/30 px-3">
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

              <TabsContent value="write" className="mt-4 focus-visible:outline-none">
                <TiptapEditor
                  initialContent={initialData?.content}
                  language={language}
                  onChange={handleEditorChange}
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
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted">
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
    </div>
  );
}
