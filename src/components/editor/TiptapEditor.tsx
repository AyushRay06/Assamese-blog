"use client";

import React, { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
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
  placeholder = "Write your story here...",
  className = "",
}: TiptapEditorProps) {
  const isAssamese = language === "AS";

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
        placeholder,
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

  // Update editor attributes when language changes
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

  return (
    <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm focus-within:ring-2 focus-within:ring-ring/50 transition-all">
      <EditorToolbar editor={editor} onImageUpload={uploadFile} />
      <div className="min-h-[350px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
