import { NextRequest, NextResponse } from "next/server";
import { verifyBasicAuthHeader, checkRateLimit } from "@/lib/auth";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { getDocumentProxy, extractText, getMeta } from "unpdf";
import { generateSlug } from "@/lib/slug";

export const maxDuration = 60; // Allow sufficient time for multi-page PDF parsing
export const dynamic = "force-dynamic";

interface FormattedPdfResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  language: "EN" | "AS";
  totalPages: number;
  wordCount: number;
}

function cleanAndFormatPdfText(
  pages: string[],
  fileName: string,
  metaTitle?: string
): FormattedPdfResult {
  let rawTitle = "";
  if (
    metaTitle &&
    typeof metaTitle === "string" &&
    metaTitle.trim().length > 3 &&
    !metaTitle.toLowerCase().includes("untitled") &&
    !metaTitle.toLowerCase().endsWith(".pdf") &&
    !metaTitle.toLowerCase().endsWith(".docx")
  ) {
    rawTitle = metaTitle.trim();
  }

  // Clean each page: remove page numbers, running headers
  const cleanedPages = pages.map((pageText) => {
    const rawLines = pageText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // Filter out lone page numbers or "Page X of Y"
    return rawLines.filter(
      (l) => !/^(?:page\s+)?\d+(?:\s*(?:of|\/)\s*\d+)?$/i.test(l)
    );
  });

  const allLines = cleanedPages.flat();
  if (allLines.length === 0) {
    const fallbackTitle = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ");
    return {
      title: fallbackTitle,
      slug: generateSlug(fallbackTitle),
      excerpt: "",
      content: "",
      language: "EN",
      totalPages: pages.length,
      wordCount: 0,
    };
  }

  let titleIndex = -1;
  if (!rawTitle) {
    // Look for first prominent line (between 4 and 150 chars)
    for (let i = 0; i < Math.min(allLines.length, 5); i++) {
      const line = allLines[i];
      if (
        line.length >= 4 &&
        line.length <= 150 &&
        !/^(?:abstract|introduction|table of contents|contents)\b/i.test(line)
      ) {
        rawTitle = line;
        titleIndex = i;
        break;
      }
    }
    if (!rawTitle) {
      rawTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    }
  }

  const bodyLines = [...allLines];
  if (titleIndex >= 0) {
    bodyLines.splice(titleIndex, 1);
  }

  const blocks: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push(currentParagraph.join(" ").trim());
      currentParagraph = [];
    }
  };

  const isHeading = (line: string) => {
    if (
      /^(?:abstract|introduction|conclusion|references|methodology|results|discussion|summary|overview|background)\b/i.test(
        line
      )
    )
      return true;
    if (/^(\d+\.|\d+\.\d+|[I|V|X]+\.)\s+[A-Za-z]/.test(line)) return true;
    // Short line in all caps or title-like without terminal punctuation
    if (
      line.length >= 4 &&
      line.length <= 65 &&
      !/[.!?।]$/.test(line) &&
      /^[A-Z0-9\s,:;\-–/]+$/.test(line)
    ) {
      return true;
    }
    return false;
  };

  const isListItem = (line: string) => {
    return /^[•*–—\u2022\u25E6\u25AA\u2023]\s*/.test(line);
  };

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];

    if (isHeading(line)) {
      flushParagraph();
      const cleanH = line.replace(/^[•*–—]\s*/, "").trim();
      blocks.push(`## ${cleanH}`);
      continue;
    }

    if (isListItem(line)) {
      flushParagraph();
      const cleanItem = line
        .replace(/^[•*–—\u2022\u25E6\u25AA\u2023]\s*/, "")
        .trim();
      blocks.push(`- ${cleanItem}`);
      continue;
    }

    // Check hyphenation at end of word across lines (e.g. "complet-" + "ion")
    if (
      line.endsWith("-") &&
      i + 1 < bodyLines.length &&
      !isHeading(bodyLines[i + 1]) &&
      !isListItem(bodyLines[i + 1])
    ) {
      const nextLine = bodyLines[i + 1];
      const nextParts = nextLine.split(/\s+/);
      const firstWord = nextParts[0] || "";
      const rest = nextParts.slice(1).join(" ");
      const mergedWord = line.slice(0, -1) + firstWord;
      currentParagraph.push(mergedWord);
      if (rest) {
        bodyLines[i + 1] = rest;
      } else {
        i++;
      }
      continue;
    }

    currentParagraph.push(line);

    // If line ends with terminal punctuation, flush paragraph
    if (/[.!?।]$/.test(line)) {
      flushParagraph();
    }
  }
  flushParagraph();

  const formattedContent = blocks.join("\n\n");

  // Extract excerpt: first regular paragraph that isn't heading or bullet
  const excerptBlock = blocks.find(
    (b) => !b.startsWith("#") && !b.startsWith("-") && b.trim().length > 20
  );
  const excerpt = excerptBlock ? excerptBlock.slice(0, 240).trim() : "";

  // Assamese script detection (Unicode U+0980 to U+09FF)
  const assameseMatches = formattedContent.match(/[\u0980-\u09FF]/g) || [];
  const language: "EN" | "AS" = assameseMatches.length > 15 ? "AS" : "EN";

  // Calculate word count
  const words = formattedContent.trim()
    ? formattedContent.split(/\s+/).filter(Boolean).length
    : 0;

  return {
    title: rawTitle,
    slug: generateSlug(rawTitle),
    excerpt,
    content: formattedContent,
    language,
    totalPages: pages.length,
    wordCount: words,
  };
}

export async function POST(request: NextRequest) {
  // 1. Authorization check
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isSessionValid = sessionCookie
    ? await verifySessionToken(sessionCookie)
    : false;
  const authHeader = request.headers.get("authorization");
  const isBasicValid = verifyBasicAuthHeader(authHeader);

  if (!isSessionValid && !isBasicValid) {
    return NextResponse.json(
      { error: "Unauthorized: Admin credentials required" },
      { status: 401 }
    );
  }

  // 2. Rate limiting (max 30 requests per minute per IP)
  const clientIp = request.headers.get("x-forwarded-for") || "admin-client";
  const rateLimit = checkRateLimit(`parse-pdf-${clientIp}`, 30, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many PDF conversion requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    const isPdfType =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdfType) {
      return NextResponse.json(
        {
          error: `Invalid file format: ${file.name}. Only PDF (.pdf) files are supported by this converter.`,
        },
        { status: 400 }
      );
    }

    // Limit PDF size to 25 MB
    const MAX_PDF_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: "PDF file exceeds the 25 MB size limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Initialize document proxy with unpdf
    const doc = await getDocumentProxy(uint8Array);
    const meta = await getMeta(doc).catch(() => null);
    const textResult = await extractText(doc, { mergePages: false });

    const pages = Array.isArray(textResult.text)
      ? textResult.text
      : [textResult.text || ""];

    // Check if extracted text is empty
    const totalRawLength = pages.reduce((acc, p) => acc + p.trim().length, 0);
    if (totalRawLength === 0) {
      return NextResponse.json(
        {
          error:
            "No readable text found in this PDF. It might be a scanned document or image-only PDF. Please use an OCR tool or standard PDF.",
        },
        { status: 422 }
      );
    }

    const metaTitle = (meta?.info as Record<string, unknown>)?.Title as
      | string
      | undefined;

    const result = cleanAndFormatPdfText(pages, file.name, metaTitle);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    console.error("PDF parsing error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process PDF file";
    return NextResponse.json(
      { error: "Error converting PDF: " + message },
      { status: 500 }
    );
  }
}
