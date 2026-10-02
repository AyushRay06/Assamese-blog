"use client";

import React, { useState, useRef } from "react";
import { type Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  Languages,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface EditorToolbarProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<string>;
  isAssamese?: boolean;
  phoneticEnabled?: boolean;
  onTogglePhonetic?: () => void;
  onTogglePalette?: () => void;
  isPaletteOpen?: boolean;
  onTransliterateContent?: () => void;
}

export function EditorToolbar({
  editor,
  onImageUpload,
  isAssamese = false,
  phoneticEnabled = false,
  onTogglePhonetic,
  onTogglePalette,
  isPaletteOpen = false,
  onTransliterateContent,
}: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setImageAlt("");
    setImageDialogOpen(true);
  };

  const handleInsertImage = () => {
    if (!imageUrl) {
      toast.error("Please provide an image URL or upload an image file");
      return;
    }
    editor
      .chain()
      .focus()
      .setImage({ src: imageUrl, alt: imageAlt || "Post illustration" })
      .run();
    setImageDialogOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, WebP, GIF, AVIF)");
      return;
    }

    try {
      setIsUploading(true);
      let uploadedUrl = "";
      if (onImageUpload) {
        uploadedUrl = await onImageUpload(file);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to upload image");
        }
        const data = await res.json();
        uploadedUrl = data.url;
      }

      setImageUrl(uploadedUrl);
      toast.success("Image uploaded successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-1 rounded-t-xl border border-b-0 bg-muted/40 p-2 text-foreground">
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
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            aria-label="Horizontal Rule"
            title="Horizontal Rule"
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

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            onClick={handleOpenImageDialog}
            aria-label="Insert Image"
            title="Insert or Upload Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Assamese / Bilingual Tools */}
        <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
          {onTogglePhonetic && (
            <Button
              type="button"
              variant={phoneticEnabled ? "default" : "outline"}
              size="sm"
              onClick={onTogglePhonetic}
              className={`h-8 gap-1.5 text-xs font-medium transition-all ${
                phoneticEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Automatically converts typed English phonetic words into Assamese on spacebar"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>Phonetic IME: {phoneticEnabled ? "ON (অসমীয়া)" : "OFF"}</span>
            </Button>
          )}

          {onTogglePalette && (
            <Button
              type="button"
              variant={isPaletteOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={onTogglePalette}
              className="h-8 gap-1 text-xs font-assamese"
              title="Show Assamese Character Keyboard & Palette"
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
              <span>To Assamese</span>
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

            {imageUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={imageAlt || "Preview"}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertImage} disabled={!imageUrl || isUploading}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
