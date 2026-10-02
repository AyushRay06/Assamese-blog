"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { transliterateTextToAssamese } from "@/lib/assamese-translit";
import { Keyboard, ArrowDownToLine, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AssameseKeyboardPaletteProps {
  onInsertChar: (char: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const VOWELS = ["অ", "আ", "ই", "ঈ", "উ", "ঊ", "ঋ", "এ", "ঐ", "ও", "ঔ"];
const MATRAS = ["া", "ি", "ী", "ু", "ূ", "ৃ", "ে", "ৈ", "ো", "ৌ", "্", "ং", "ঃ", "ঁ"];
const CONSONANTS = [
  "ক", "খ", "গ", "ঘ", "ঙ",
  "চ", "ছ", "জ", "ঝ", "ঞ",
  "ট", "ঠ", "ড", "ঢ", "ণ",
  "ত", "থ", "দ", "ধ", "ন",
  "প", "ফ", "ব", "ভ", "ম",
  "য", "ৰ", "ল", "ৱ", "শ",
  "ষ", "স", "হ", "ক্ষ", "ড়",
  "ঢ়", "য়", "ৎ"
];
const CONJUNCTS = [
  "ক্ত", "ক্ষ", "জ্ঞ", "ঞ্চ", "ঞ্জ", "ট্ট", "ত্ত", "ত্ৰ", "দ্দ", "দ্ব",
  "ন্ত", "ন্দ", "ন্ধ", "প্ৰ", "ম্প", "ম্ব", "ল্ল", "ষ্ট", "ষ্ঠ", "স্থ", "স্ন", "হ্ন", "হ্ম"
];
const NUMERALS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "।", "॥"];

export function AssameseKeyboardPalette({
  onInsertChar,
  isOpen,
  onToggle,
}: AssameseKeyboardPaletteProps) {
  const [testText, setTestText] = useState("");
  const [copied, setCopied] = useState(false);

  const convertedText = transliterateTextToAssamese(testText);

  const handleInsertConverted = () => {
    if (!convertedText) return;
    onInsertChar(convertedText);
    setTestText("");
    toast.success("Inserted Assamese text at cursor");
  };

  const handleCopyConverted = () => {
    if (!convertedText) return;
    navigator.clipboard.writeText(convertedText);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="gap-1.5 text-xs font-assamese border-primary/30 text-primary hover:bg-primary/5"
      >
        <Keyboard className="h-3.5 w-3.5" />
        <span>অসমীয়া কিবৰ্ড আৰু বৰ্ণমালা (Palette)</span>
      </Button>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 shadow-sm space-y-4 font-sans animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2.5">
        <div className="flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">
            অসমীয়া লিখন সহায়ক (Assamese Typing Assistant)
          </h4>
          <Badge variant="secondary" className="text-[10px]">
            SMES / Asamiya
          </Badge>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          Close Palette &times;
        </Button>
      </div>

      {/* Interactive Phonetic Transliteration Box */}
      <div className="rounded-lg border bg-background p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            ফনেটিক টাইপিং (Type English, get Assamese):
          </span>
          <span className="text-[11px] text-muted-foreground">
            Try: <code className="bg-muted px-1 rounded">namaskar</code>, <code className="bg-muted px-1 rounded">axom</code>, <code className="bg-muted px-1 rounded">bhal</code>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="Type in English (e.g. 'aami axom bhal pao')..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="text-sm"
          />

          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-muted/40 px-3 py-2 text-base font-assamese truncate min-h-[38px] flex items-center text-foreground font-semibold">
              {convertedText || <span className="text-muted-foreground font-normal text-xs">অসমীয়া ফলাফল ইয়াত ওলাব...</span>}
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleInsertConverted}
              disabled={!convertedText}
              className="gap-1 text-xs shrink-0"
              title="Insert into editor at cursor"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              <span>Insert</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopyConverted}
              disabled={!convertedText}
              className="h-8 w-8 shrink-0"
              title="Copy Assamese text"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Character Grid Tabs/Sections */}
      <div className="space-y-2.5 text-xs">
        {/* Vowels */}
        <div>
          <span className="font-semibold text-muted-foreground block mb-1">
            স্বৰবৰ্ণ (Vowels):
          </span>
          <div className="flex flex-wrap gap-1">
            {VOWELS.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => onInsertChar(char)}
                className="flex h-8 w-8 items-center justify-center rounded-md border bg-background font-assamese text-base font-medium transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
                title={`Insert ${char}`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>

        {/* Matras */}
        <div>
          <span className="font-semibold text-muted-foreground block mb-1">
            স্বৰচিহ্ন / মাত্ৰা (Matras &amp; Modifiers):
          </span>
          <div className="flex flex-wrap gap-1">
            {MATRAS.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => onInsertChar(char)}
                className="flex h-8 w-8 items-center justify-center rounded-md border bg-secondary font-assamese text-base font-medium transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
                title={`Insert ${char}`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>

        {/* Consonants */}
        <div>
          <span className="font-semibold text-muted-foreground block mb-1">
            ব্যঞ্জনবৰ্ণ (Consonants):
          </span>
          <div className="flex flex-wrap gap-1">
            {CONSONANTS.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => onInsertChar(char)}
                className="flex h-8 w-8 items-center justify-center rounded-md border bg-background font-assamese text-base font-medium transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
                title={`Insert ${char}`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>

        {/* Conjuncts & Numerals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <span className="font-semibold text-muted-foreground block mb-1">
              যুক্তাক্ষৰ (Common Conjuncts):
            </span>
            <div className="flex flex-wrap gap-1">
              {CONJUNCTS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => onInsertChar(char)}
                  className="px-2 h-8 flex items-center justify-center rounded-md border bg-background font-assamese text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
                  title={`Insert ${char}`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="font-semibold text-muted-foreground block mb-1">
              সংখ্যা আৰু বিৰাম (Numerals &amp; Dari):
            </span>
            <div className="flex flex-wrap gap-1">
              {NUMERALS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => onInsertChar(char)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border bg-background font-assamese text-base font-medium transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
                  title={`Insert ${char}`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
