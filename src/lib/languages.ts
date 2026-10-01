export type LanguageCode = "EN" | "AS";

export interface LanguageConfig {
  code: LanguageCode;
  label: string;
  nativeName: string;
  langAttr: string;
  fontClass: string;
  badgeVariant?: "default" | "secondary" | "outline";
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  EN: {
    code: "EN",
    label: "English",
    nativeName: "English",
    langAttr: "en",
    fontClass: "font-sans",
    badgeVariant: "secondary",
  },
  AS: {
    code: "AS",
    label: "Assamese",
    nativeName: "অসমীয়া",
    langAttr: "as",
    fontClass: "font-assamese",
    badgeVariant: "default",
  },
};

export const DEFAULT_LANGUAGE: LanguageCode = "EN";

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === "EN" || value === "AS";
}

/**
 * Calculates reading time in minutes:
 * Words for English, character/syllable-based estimate for Assamese.
 */
export function calculateReadingTime(text: string, language: LanguageCode): number {
  if (!text || text.trim().length === 0) return 1;

  if (language === "AS") {
    // For Assamese, standard reading speed is around 400-500 characters per minute
    const cleanedChars = text.replace(/\s+/g, "").length;
    const minutes = Math.ceil(cleanedChars / 450);
    return Math.max(1, minutes);
  } else {
    // English average ~200 words per minute
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(words / 200);
    return Math.max(1, minutes);
  }
}
