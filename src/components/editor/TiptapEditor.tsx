"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import { AssameseKeyboardPalette } from "./AssameseKeyboardPalette";
import { transliterateTextToAssamese, transliterateWordToAssamese } from "@/lib/assamese-translit";
import { toast } from "sonner";
import { LanguageCode } from "@/lib/languages";
import { cn } from "cn";

export interface EditorStats {
  words: number;
  chars: number;
  readingTime: number;
  paragraphs: number;
}

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
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to upload image");
    }

    const data = await res.json();
    return data.url;
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
      : "Write your article using headings, images, lists, and formatting...");

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
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: "rounded-none border border-border max-w-full h-auto my-4",
        },
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
                const node = schema.nodes.image.create({ src: url });
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
                    const node = schema.nodes.image.create({ src: url });
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
