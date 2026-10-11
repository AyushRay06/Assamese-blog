"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
  mergeAttributes,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import { AssameseKeyboardPalette } from "./AssameseKeyboardPalette";
import { transliterateTextToAssamese, transliterateWordToAssamese } from "@/lib/assamese-translit";
import { compressImageClient } from "@/lib/image-compression";
import { toast } from "sonner";
import { LanguageCode } from "@/lib/languages";
import { cn } from "cn";
import {
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
} from "lucide-react";

export interface EditorStats {
  words: number;
  chars: number;
  readingTime: number;
  paragraphs: number;
}

/**
 * Interactive Resizable and Movable NodeView for In-Body Images
 */
function ResizableImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const resizeStartRef = useRef<{ startX: number; startW: number; parentW: number } | null>(null);

  const src = node.attrs.src;
  const alt = node.attrs.alt || "Blog image";
  const alignment = (node.attrs.alignment as "left" | "center" | "right") || "center";
  const width = (node.attrs.width as string) || "100%";

  // Alignment classes for outer flex wrapper
  const alignClass =
    alignment === "left"
      ? "justify-start"
      : alignment === "right"
      ? "justify-end"
      : "justify-center";

  // Handle pointer down on corner resize handle
  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const imgEl = imgRef.current;
    const parentEl = containerRef.current?.parentElement;
    const currentW = imgEl?.clientWidth || 300;
    const parentW = parentEl?.clientWidth || 600;

    resizeStartRef.current = {
      startX: e.clientX,
      startW: currentW,
      parentW: parentW,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent, direction: "right" | "left") => {
    if (!isResizing || !resizeStartRef.current) return;
    const { startX, startW, parentW } = resizeStartRef.current;
    const deltaX = direction === "right" ? e.clientX - startX : startX - e.clientX;
    const newWidthPx = Math.max(100, Math.min(parentW, startW + deltaX));
    const newPercent = Math.min(100, Math.max(15, Math.round((newWidthPx / parentW) * 100)));
    updateAttributes({ width: `${newPercent}%` });
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    if (isResizing) {
      setIsResizing(false);
      resizeStartRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
    }
  };

  const showControls = selected || isHovered || isResizing;
  const widthNumeric = parseInt(width, 10) || 100;

  const setWidthPercent = (pct: number) => {
    const clamped = Math.min(100, Math.max(15, pct));
    updateAttributes({ width: `${clamped}%` });
  };

  return (
    <NodeViewWrapper
      className={cn("my-6 w-full flex select-none transition-all", alignClass)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        className="relative group transition-all"
        style={{
          width: width,
          maxWidth: "100%",
        }}
      >
        {/* Floating Mini Action Toolbar */}
        {showControls && (
          <div
            className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1 bg-card/95 border border-border/80 rounded-lg shadow-xl backdrop-blur-md text-card-foreground animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Draggable move handle */}
            <div
              data-drag-handle
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-colors"
              title="Drag to move image anywhere in blog"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>

            <div className="h-4 w-px bg-border/60 mx-0.5" />

            {/* Alignment buttons */}
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: "left" })}
              className={cn(
                "p-1 rounded text-xs transition-colors cursor-pointer",
                alignment === "left"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Align left"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: "center" })}
              className={cn(
                "p-1 rounded text-xs transition-colors cursor-pointer",
                alignment === "center"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Align center"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: "right" })}
              className={cn(
                "p-1 rounded text-xs transition-colors cursor-pointer",
                alignment === "right"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Align right"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>

            <div className="h-4 w-px bg-border/60 mx-0.5" />

            {/* Quick Size Presets */}
            <div className="flex items-center gap-0.5">
              {[25, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setWidthPercent(preset)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer",
                    widthNumeric === preset
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title={`Resize to ${preset}%`}
                >
                  {preset}%
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border/60 mx-0.5" />

            {/* Delete button */}
            <button
              type="button"
              onClick={() => deleteNode()}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title="Remove image from canvas"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* The Image Itself */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={cn(
            "w-full h-auto rounded-xl border border-border/50 shadow-xs block cursor-pointer transition-all",
            showControls && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          draggable={false}
        />

        {/* Corner Resize Handles */}
        {showControls && (
          <>
            {/* Right Resize Handle */}
            <div
              onPointerDown={(e) => handleResizeStart(e)}
              onPointerMove={(e) => handleResizeMove(e, "right")}
              onPointerUp={handleResizeEnd}
              onPointerCancel={handleResizeEnd}
              className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-nwse-resize shadow-lg hover:scale-125 active:scale-95 transition-transform z-20"
              title="Drag to resize image width"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>

            {/* Left Resize Handle */}
            <div
              onPointerDown={(e) => handleResizeStart(e)}
              onPointerMove={(e) => handleResizeMove(e, "left")}
              onPointerUp={handleResizeEnd}
              onPointerCancel={handleResizeEnd}
              className="absolute -bottom-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-nesw-resize shadow-lg hover:scale-125 active:scale-95 transition-transform z-20"
              title="Drag to resize image width"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>

            {/* Current Width Badge */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-xs">
              {width}
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Tiptap Extension with drag-and-drop movement and custom width/alignment attributes
 */
export const AlignableImage = Image.extend({
  name: "image",
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({
          "data-align": attributes.alignment || "center",
        }),
      },
      width: {
        default: "100%",
        parseHTML: (element) => {
          return (
            element.getAttribute("data-width") ||
            element.style.width ||
            element.getAttribute("width") ||
            "100%"
          );
        },
        renderHTML: (attributes) => {
          const w = attributes.width || "100%";
          return {
            "data-width": w,
            style: `width: ${w}; max-width: 100%; height: auto;`,
          };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes["data-align"] || "center";
    const width = HTMLAttributes["data-width"] || "100%";
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `rounded-xl border border-border/40 shadow-xs align-${align}`,
        style: `width: ${width}; max-width: 100%; height: auto;`,
      }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});

interface TiptapEditorProps {
  initialContent?: object | string;
  language: LanguageCode;
  onChange: (data: { json: object; html: string }) => void;
  placeholder?: string;
  className?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  fontSize?: "normal" | "comfortable" | "spacious";
  onStatsChange?: (stats: EditorStats) => void;
}

export function TiptapEditor({
  initialContent,
  language,
  onChange,
  placeholder,
  className = "",
  isFullScreen = false,
  onToggleFullScreen,
  fontSize = "normal",
  onStatsChange,
}: TiptapEditorProps) {
  const isAssamese = language === "AS";

  // Phonetic typing state (auto-enabled when language is Assamese)
  const [phoneticEnabled, setPhoneticEnabled] = useState(isAssamese);
  const [prevLanguage, setPrevLanguage] = useState(language);
  if (prevLanguage !== language) {
    setPrevLanguage(language);
    setPhoneticEnabled(language === "AS");
  }

  const [paletteOpen, setPaletteOpen] = useState(false);
  const phoneticRef = useRef(phoneticEnabled);

  useEffect(() => {
    phoneticRef.current = phoneticEnabled;
  }, [phoneticEnabled]);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    try {
      const { file: compressedFile, dataUrl } = await compressImageClient(file);
      const formData = new FormData();
      formData.append("file", compressedFile);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        if (dataUrl) return dataUrl;
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload image");
      }

      const data = await res.json();
      return data.url || dataUrl;
    } catch (err) {
      throw err;
    }
  }, []);

  const getProseClasses = useCallback(() => {
    let sizeClass = "text-base sm:text-lg leading-relaxed";
    if (fontSize === "comfortable") {
      sizeClass = isAssamese
        ? "text-xl sm:text-2xl leading-loose"
        : "text-lg sm:text-[19px] leading-relaxed";
    } else if (fontSize === "spacious") {
      sizeClass = isAssamese
        ? "text-2xl sm:text-3xl leading-loose"
        : "text-xl sm:text-[21px] leading-loose";
    } else {
      sizeClass = isAssamese
        ? "text-lg sm:text-xl leading-relaxed"
        : "text-base sm:text-lg leading-relaxed";
    }

    const fontClass = isAssamese ? "font-assamese" : "font-sans";
    const paddingClass = isFullScreen
      ? "px-2 py-4 sm:py-6 min-h-[60vh] pb-72"
      : "p-4 sm:p-6 min-h-[420px]";

    return `prose prose-neutral dark:prose-invert max-w-none focus:outline-none ${fontClass} ${sizeClass} ${paddingClass} ${className}`;
  }, [fontSize, isAssamese, isFullScreen, className]);

  const dynamicPlaceholder =
    placeholder ||
    (isAssamese
      ? "অসমীয়াত লিখক... (ফনেটিক টাইপিং সক্ৰিয়: 'namaskar' টাইপ কৰি Space টিপক)"
      : "Write your blog using headings, images, lists, and formatting...");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      AlignableImage.configure({
        inline: false,
      }),
      Placeholder.configure({
        placeholder: dynamicPlaceholder,
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: getProseClasses(),
        lang: isAssamese ? "as" : "en",
        spellcheck: "false",
      },
      handleKeyDown: (view, event) => {
        // If phonetic IME is enabled and user pressed Space or punctuation
        if (!phoneticRef.current) return false;

        if (event.key === " " || event.key === "Enter" || event.key === "," || event.key === "." || event.key === "?" || event.key === "!") {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;

          // Find the word immediately preceding the cursor in the current text block
          const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
          const wordMatch = textBefore.match(/([a-zA-Z]+)$/);

          if (wordMatch) {
            const rawWord = wordMatch[1];
            const transliterated = transliterateWordToAssamese(rawWord);

            if (transliterated && transliterated !== rawWord) {
              event.preventDefault();
              const wordStartPos = $from.pos - rawWord.length;
              const wordEndPos = $from.pos;

              const charToAppend = event.key === "Enter" ? "" : event.key;
              const replacement = transliterated + charToAppend;

              const tr = state.tr.replaceWith(
                wordStartPos,
                wordEndPos,
                state.schema.text(replacement)
              );

              if (event.key === "Enter") {
                view.dispatch(tr);
                // Dispatch Enter after replacement
                editor?.commands.splitBlock();
              } else {
                view.dispatch(tr);
              }
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            toast.loading("Uploading dropped image...", { id: "editor-upload" });
            uploadFile(file)
              .then((url) => {
                toast.success("Image uploaded", { id: "editor-upload" });
                const { schema } = view.state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                const node = schema.nodes.image.create({
                  src: url,
                  alignment: "center",
                  width: "100%",
                });
                const transaction = view.state.tr.insert(coordinates?.pos ?? view.state.doc.content.size, node);
                view.dispatch(transaction);
              })
              .catch((err) => {
                toast.error(err.message, { id: "editor-upload" });
              });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              const file = items[i].getAsFile();
              if (file) {
                event.preventDefault();
                toast.loading("Uploading pasted image...", { id: "editor-upload" });
                uploadFile(file)
                  .then((url) => {
                    toast.success("Image uploaded", { id: "editor-upload" });
                    const { schema } = view.state;
                    const node = schema.nodes.image.create({
                      src: url,
                      alignment: "center",
                      width: "100%",
                    });
                    const transaction = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(transaction);
                  })
                  .catch((err) => {
                    toast.error(err.message, { id: "editor-upload" });
                  });
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange({
        json: ed.getJSON(),
        html: ed.getHTML(),
      });
      const text = ed.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const readingTime = Math.max(1, Math.ceil(words / 200));
      const paragraphs = text.split(/\n+/).filter(Boolean).length;
      onStatsChange?.({ words, chars, readingTime, paragraphs });
    },
    onCreate: ({ editor: ed }) => {
      const text = ed.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const readingTime = Math.max(1, Math.ceil(words / 200));
      const paragraphs = text.split(/\n+/).filter(Boolean).length;
      onStatsChange?.({ words, chars, readingTime, paragraphs });
    },
    immediatelyRender: false,
  });

  // Update editor attributes and placeholder when language or font size changes
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: getProseClasses(),
            lang: isAssamese ? "as" : "en",
            spellcheck: "false",
          },
        },
      });
    }
  }, [editor, getProseClasses, isAssamese]);

  // Insert character or word at cursor
  const handleInsertChar = (char: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(char).run();
  };

  // Convert current content into Assamese
  const handleTransliterateContent = () => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const converted = transliterateTextToAssamese(currentHtml);
    editor.commands.setContent(converted);
    toast.success("Converted content to Assamese");
  };

  return (
    <div
      className={cn(
        "flex flex-col transition-all",
        isFullScreen
          ? "border-0 shadow-none bg-transparent space-y-0"
          : "rounded-none border border-border bg-card text-card-foreground shadow-none focus-within:ring-1 focus-within:ring-ring space-y-2"
      )}
    >
      <EditorToolbar
        editor={editor}
        onImageUpload={uploadFile}
        isAssamese={isAssamese}
        phoneticEnabled={phoneticEnabled}
        onTogglePhonetic={() => {
          const next = !phoneticEnabled;
          setPhoneticEnabled(next);
          toast.info(
            next
              ? "Assamese SMS Keyboard Enabled (type 'namaskar' + Space)"
              : "SMS Keyboard Disabled"
          );
        }}
        onTogglePalette={() => setPaletteOpen(!paletteOpen)}
        isPaletteOpen={paletteOpen}
        onTransliterateContent={handleTransliterateContent}
        isFullScreen={isFullScreen}
        onToggleFullScreen={onToggleFullScreen}
      />

      {paletteOpen && (
        <div className={cn(isFullScreen ? "py-2" : "px-3")}>
          <AssameseKeyboardPalette
            isOpen={paletteOpen}
            onToggle={() => setPaletteOpen(!paletteOpen)}
            onInsertChar={handleInsertChar}
          />
        </div>
      )}

      <div className={isFullScreen ? "w-full" : "min-h-[500px]"}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default TiptapEditor;
