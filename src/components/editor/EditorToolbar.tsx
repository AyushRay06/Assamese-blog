"use client";

import React, { useState, useRef } from "react";
import { type Editor } from "@tiptap/react";
import { compressImageClient } from "@/lib/image-compression";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Undo,
  Redo,
  Upload,
  Keyboard,
  Maximize2,
  Minimize2,
  HelpCircle,
  Languages,
  Sparkles,
  FileCode,
  Command,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

interface EditorToolbarProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<string>;
  isAssamese?: boolean;
  phoneticEnabled?: boolean;
  onTogglePhonetic?: () => void;
  onTogglePalette?: () => void;
  isPaletteOpen?: boolean;
  onTransliterateContent?: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  className?: string;
}

export function EditorToolbar({
  editor,
  onImageUpload,
  phoneticEnabled = false,
  onTogglePhonetic,
  onTogglePalette,
  isPaletteOpen = false,
  onTransliterateContent,
  isFullScreen = false,
  onToggleFullScreen,
  className,
}: EditorToolbarProps) {
  const [smsGuideOpen, setSmsGuideOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  // Link Handling
  const handleOpenLinkDialog = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setLinkDialogOpen(true);
  };

  const handleSaveLink = () => {
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl, target: "_blank" })
        .run();
    }
    setLinkDialogOpen(false);
  };

  // Image Handling
  const handleOpenImageDialog = () => {
    setImageUrl("");
    setLocalPreviewUrl("");
    setImageAlt("");
    setImageDialogOpen(true);
  };

  const handleInsertImage = () => {
    const finalUrl = imageUrl || localPreviewUrl;
    if (!finalUrl) {
      toast.error("Please provide an image URL or upload an image file");
      return;
    }
    editor
      .chain()
      .focus()
      .setImage({ src: finalUrl, alt: imageAlt || "Post illustration" })
      .run();
    setImageDialogOpen(false);
    setImageUrl("");
    setLocalPreviewUrl("");
    setImageAlt("");
    toast.success("Image inserted into article body");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, WebP, GIF, AVIF)");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(localUrl);

    try {
      setIsUploading(true);
      const { file: compressedFile, dataUrl } = await compressImageClient(file);
      if (dataUrl) {
        setLocalPreviewUrl(dataUrl);
        setImageUrl(dataUrl);
      }

      let uploadedUrl = "";
      if (onImageUpload) {
        uploadedUrl = await onImageUpload(compressedFile);
      } else {
        const formData = new FormData();
        formData.append("file", compressedFile);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedUrl = data.url;
        } else if (dataUrl) {
          uploadedUrl = dataUrl;
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to upload image");
        }
      }

      setImageUrl(uploadedUrl || dataUrl);
      toast.success("Image uploaded! Ready to insert.");
    } catch (err) {
      if (!imageUrl && !localPreviewUrl) {
        setLocalPreviewUrl("");
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } else {
        toast.info("Image compressed and ready");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (!rawFile.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, WebP, GIF, AVIF)");
      return;
    }

    try {
      toast.loading("Optimizing and inserting image...", { id: "direct-image-upload" });
      const { file: compressedFile, dataUrl } = await compressImageClient(rawFile);

      let uploadedUrl = "";
      if (onImageUpload) {
        uploadedUrl = await onImageUpload(compressedFile);
      } else {
        const formData = new FormData();
        formData.append("file", compressedFile);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedUrl = data.url;
        } else if (dataUrl) {
          uploadedUrl = dataUrl;
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to upload image");
        }
      }

      const finalSrc = uploadedUrl || dataUrl;
      editor
        .chain()
        .focus()
        .setImage({ src: finalSrc, alt: rawFile.name.replace(/\.[^/.]+$/, "") })
        .run();

      toast.success("Image inserted into article body!", { id: "direct-image-upload" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", {
        id: "direct-image-upload",
      });
    } finally {
      if (directFileInputRef.current) directFileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-1 p-2 text-foreground transition-all",
          isFullScreen
            ? "sticky top-14 z-30 bg-background/95 backdrop-blur-md border-b border-border/60 shadow-xs"
            : "rounded-none border border-b-0 bg-muted/40",
          className
        )}
      >
        <div className="flex flex-wrap items-center gap-1">
          {/* Undo / Redo */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Headings */}
          <Button
            type="button"
            variant={editor.isActive("paragraph") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setParagraph().run()}
            aria-label="Paragraph"
            title="Normal Text / Paragraph"
          >
            <Pilcrow className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            aria-label="Heading 1"
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="Heading 2"
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            aria-label="Heading 3"
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Inline Formatting */}
          <Button
            type="button"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4 font-bold" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("underline") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("code") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleCode().run()}
            aria-label="Inline Code"
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text Alignment */}
          <Button
            type="button"
            variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            aria-label="Align Left"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            aria-label="Align Center"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            aria-label="Align Right"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Lists & Quotes */}
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet List"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Numbered List"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Blockquote"
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            aria-label="Code Block"
            title="Preformatted Code Block"
          >
            <FileCode className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            aria-label="Horizontal Rule"
            title="Horizontal Divider"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Links & Images */}
          <Button
            type="button"
            variant={editor.isActive("link") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={handleOpenLinkDialog}
            aria-label="Insert Link"
            title="Insert Hyperlink"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          {editor.isActive("link") && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => editor.chain().focus().unsetLink().run()}
              aria-label="Remove Link"
              title="Remove Hyperlink"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}

          {/* Quick Upload hidden input */}
          <input
            ref={directFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={handleDirectUpload}
            className="hidden"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            onClick={handleOpenImageDialog}
            aria-label="Insert Image"
            title="Insert Image (Modal with Preview)"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => directFileInputRef.current?.click()}
            aria-label="Quick Upload Image"
            title="Quick Upload Image into Body (1-Click)"
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Assamese / Bilingual Tools & FullScreen */}
        <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
          {onTogglePhonetic && (
            <Button
              type="button"
              variant={phoneticEnabled ? "default" : "outline"}
              size="sm"
              onClick={onTogglePhonetic}
              className={`h-8 gap-1.5 text-xs font-medium transition-all ${
                phoneticEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground border-border/80"
              }`}
              title="SMS Typing: Type in English (e.g. namaskar, axom, luit) + Space converts to Assamese"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>SMS Keyboard: {phoneticEnabled ? "ON" : "OFF"}</span>
            </Button>
          )}

          {phoneticEnabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSmsGuideOpen(true)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="How to type Assamese using English / SMS keyboard"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </Button>
          )}

          {onTogglePalette && (
            <Button
              type="button"
              variant={isPaletteOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={onTogglePalette}
              className="h-8 gap-1 text-xs font-assamese"
              title="Assamese Character Palette / On-Screen Keyboard"
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>কিবৰ্ড</span>
            </Button>
          )}

          {onTransliterateContent && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onTransliterateContent}
              className="h-8 gap-1 text-xs text-primary hover:text-primary"
              title="Convert entire content from English phonetics to Assamese"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>To অসমীয়া</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard Shortcuts"
            title="Keyboard Shortcuts & Markdown Tricks"
          >
            <Command className="h-3.5 w-3.5" />
          </Button>

          {onToggleFullScreen && (
            <Button
              type="button"
              variant={isFullScreen ? "default" : "outline"}
              size="sm"
              onClick={onToggleFullScreen}
              className="h-8 gap-1.5 text-xs font-mono ml-1"
              title={isFullScreen ? "Exit Full-Screen Canvas" : "Full-Screen Writing Canvas"}
            >
              {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isFullScreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Hyperlink</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="link-url">Destination URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLink}>Apply Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Insert Article Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            {/* File Upload Trigger */}
            <div className="space-y-2">
              <Label>Upload File (Max 5MB)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 border-dashed h-20"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span>
                  {isUploading ? "Uploading image..." : "Choose image to upload"}
                </span>
              </Button>
            </div>

            <div className="relative flex items-center justify-center">
              <Separator className="w-full" />
              <span className="absolute bg-background px-2 text-xs text-muted-foreground">
                or use an image URL
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="img-url">Image URL</Label>
              <Input
                id="img-url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="img-alt">Alt Text (Accessibility &amp; SEO)</Label>
              <Input
                id="img-alt"
                placeholder="A description of the image content..."
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
              />
            </div>

            {(imageUrl || localPreviewUrl) && (
              <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl || localPreviewUrl}
                  alt={imageAlt || "Preview"}
                  className="h-full w-full object-contain bg-background/50"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 z-10">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs font-medium">Uploading image...</span>
                  </div>
                )}
                {!isUploading && imageUrl && (
                  <div className="absolute bottom-2 left-2 right-2 bg-background/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Upload complete &bull; Ready to insert</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInsertImage}
              disabled={(!imageUrl && !localPreviewUrl) || isUploading}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Insert into Article</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SMS Typing Guide Dialog */}
      <Dialog open={smsGuideOpen} onOpenChange={setSmsGuideOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              <span>Assamese SMS Keyboard Guide (ফনেটিক সহায়িকা)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <p className="text-xs text-muted-foreground leading-relaxed">
              When SMS Keyboard is ON, type words in standard English/SMS spelling. Pressing <strong>Space</strong> or punctuation converts the word into authentic Assamese script automatically.
            </p>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Common Word Examples:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div><code>namaskar</code> → নমস্কাৰ</div>
                <div><code>axom / asom</code> → অসম</div>
                <div><code>axomiya</code> → অসমীয়া</div>
                <div><code>bhal</code> → ভাল</div>
                <div><code>dhanyabad</code> → ধন্যবাদ</div>
                <div><code>luit</code> → লুইত</div>
                <div><code>borluit</code> → বৰলুইত</div>
                <div><code>tumi</code> → তুমি</div>
                <div><code>apuni</code> → আপুনি</div>
                <div><code>moi</code> → মই</div>
                <div><code>aami</code> → আমি</div>
                <div><code>bhasha</code> → ভাষা</div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Letter Mapping:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div><code>k</code> = ক, <code>kh</code> = খ</div>
                <div><code>g</code> = গ, <code>gh</code> = ঘ</div>
                <div><code>c / s</code> = চ, <code>j</code> = জ</div>
                <div><code>t</code> = ট, <code>th</code> = ঠ</div>
                <div><code>d</code> = ড, <code>dh</code> = ঢ</div>
                <div><code>p</code> = প, <code>ph / f</code> = ফ</div>
                <div><code>b</code> = ব, <code>bh / v</code> = ভ</div>
                <div><code>m</code> = ম, <code>r</code> = ৰ</div>
                <div><code>w</code> = ৱ, <code>l</code> = ল</div>
                <div><code>x / s</code> = স / শ</div>
                <div><code>h</code> = হ, <code>khy</code> = ক্ষ</div>
                <div><code>gy</code> = জ্ঞ, <code>ng</code> = ং / ঙ</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground italic">
              Tip: You can also use the on-screen &ldquo;কিবৰ্ড&rdquo; palette button on the toolbar to click and insert any character directly.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-5 w-5 text-primary" />
              <span>Keyboard Shortcuts &amp; Speed Tips</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-2">
              <h4 className="font-semibold uppercase tracking-wider text-muted-foreground">Text Formatting</h4>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Bold</span>
                  <code>Ctrl+B / ⌘B</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Italic</span>
                  <code>Ctrl+I / ⌘I</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Underline</span>
                  <code>Ctrl+U / ⌘U</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Inline Code</span>
                  <code>Ctrl+E / ⌘E</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Undo</span>
                  <code>Ctrl+Z / ⌘Z</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Redo</span>
                  <code>Ctrl+Y / ⌘⇧Z</code>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold uppercase tracking-wider text-muted-foreground">Markdown Headings &amp; Blocks</h4>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Heading 1</span>
                  <code># + Space</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Heading 2</span>
                  <code>## + Space</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Heading 3</span>
                  <code>### + Space</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Bullet List</span>
                  <code>- + Space</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Numbered List</span>
                  <code>1. + Space</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Blockquote</span>
                  <code>&gt; + Space</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Divider Line</span>
                  <code>--- + Enter</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Code Block</span>
                  <code>``` + Space</code>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold uppercase tracking-wider text-muted-foreground">Assamese &amp; Studio</h4>
              <div className="grid grid-cols-1 gap-2 font-mono">
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Assamese SMS Transliteration</span>
                  <code>Type in English + Space</code>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Exit Fullscreen Studio</span>
                  <code>Esc</code>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
