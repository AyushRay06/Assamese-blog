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

interface TiptapEditorProps {
  initialContent?: object | string;
  language: LanguageCode;
  onChange: (data: { json: object; html: string }) => void;
  placeholder?: string;
  className?: string;
}

export function TiptapEditor({
  initialContent,
  language,
  onChange,
  placeholder,
  className = "",
}: TiptapEditorProps) {
  const isAssamese = language === "AS";

  // Phonetic typing state (auto-enabled when language is Assamese)
  const [phoneticEnabled, setPhoneticEnabled] = useState(isAssamese);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const phoneticRef = useRef(phoneticEnabled);
  phoneticRef.current = phoneticEnabled;

  useEffect(() => {
    setPhoneticEnabled(language === "AS");
  }, [language]);

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
          class: "rounded-xl max-w-full h-auto my-4 shadow-md",
        },
      }),
      Placeholder.configure({
        placeholder: dynamicPlaceholder,
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: `prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[350px] p-4 sm:p-6 ${
          isAssamese
            ? "font-assamese text-lg leading-relaxed"
            : "font-sans text-base leading-relaxed"
        } ${className}`,
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
    },
    immediatelyRender: false,
  });

  // Update editor attributes and placeholder when language changes
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: `prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[350px] p-4 sm:p-6 ${
              isAssamese
                ? "font-assamese text-lg leading-relaxed"
                : "font-sans text-base leading-relaxed"
            } ${className}`,
            lang: isAssamese ? "as" : "en",
            spellcheck: "false",
          },
        },
      });
    }
  }, [editor, isAssamese, className]);

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
    <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm focus-within:ring-2 focus-within:ring-ring/50 transition-all space-y-2">
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
              ? "Assamese Phonetic IME Enabled (type 'namaskar' + Space)"
              : "Phonetic IME Disabled"
          );
        }}
        onTogglePalette={() => setPaletteOpen(!paletteOpen)}
        isPaletteOpen={paletteOpen}
        onTransliterateContent={handleTransliterateContent}
      />

      {paletteOpen && (
        <div className="px-3">
          <AssameseKeyboardPalette
            isOpen={paletteOpen}
            onToggle={() => setPaletteOpen(!paletteOpen)}
            onInsertChar={handleInsertChar}
          />
        </div>
      )}

      <div className="min-h-[350px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
