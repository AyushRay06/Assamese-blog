/**
 * Comprehensive Assamese Phonetic Transliteration Engine
 * Avro / Rodali-compatible phonetic mappings for authentic Assamese script.
 */

// Common words dictionary for highest precision
const COMMON_WORDS: Record<string, string> = {
  // Pronouns
  "moi": "মই",
  "tumi": "তুমি",
  "aami": "আমি",
  "ami": "আমি",
  "apuni": "আপুনি",
  "tai": "তাই",
  "teo": "তেওঁ",
  "teon": "তেওঁ",
  "heo": "তেওঁ",
  "xihot": "সিহঁত",
  "sihot": "সিহঁত",
  // Common vocabulary
  "namaskar": "নমস্কাৰ",
  "nomoskar": "নমস্কাৰ",
  "dhanyabad": "ধন্যবাদ",
  "dhonyobad": "ধন্যবাদ",
  "axom": "অসম",
  "asom": "অসম",
  "assam": "অসম",
  "axomiya": "অসমীয়া",
  "asamiya": "অসমীয়া",
  "smes": "অসমীয়া",
  "bhal": "ভাল",
  "khabor": "খবৰ",
  "aaji": "আজি",
  "aji": "আজি",
  "kaali": "কালি",
  "kali": "কালি",
  "kio": "কিয়",
  "kiyo": "কিয়",
  "ki": "কি",
  "kiba": "কিবা",
  "kenekoi": "কেনেকৈ",
  "keneke": "কেনেকৈ",
  "manuh": "মানুহ",
  "ghor": "ঘৰ",
  "borluit": "বৰলুইত",
  "luit": "লুইত",
  "nodi": "নদী",
  "nodie": "নদী",
  "nodir": "নদীৰ",
  "bhasha": "ভাষা",
  "matribhasha": "মাতৃভাষা",
  "sahitya": "সাহিত্য",
  "jugot": "যুগত",
  "gurutwa": "গুৰুত্ব",
  "kitap": "কিতাপ",
  "somoy": "সময়",
  "khua": "খোৱা",
  "pao": "পাওঁ",
  "paon": "পাওঁ",
  "pau": "পাওঁ",
  "kora": "কৰা",
  "kori": "কৰি",
  "koribo": "কৰিব",
  "ase": "আছে",
  "naai": "নাই",
  "nai": "নাই",
  "hoi": "হয়",
  "nohoi": "নহয়",
  "eti": "এটি",
  "eta": "এটা",
  "ek": "এক",
  "du": "দুই",
  "tin": "তিনি",
  "char": "চাৰি",
  "paas": "পাঁচ",
  "soi": "ছয়",
  "sat": "সাত",
  "aat": "আঠ",
  "no": "ন",
  "doh": "দহ",
  "dost": "দস্ত",
  "itihash": "ইতিহাস",
  "sristi": "সৃষ্টি",
  "jagat": "জগত",
  "prithivi": "পৃথিৱী",
  "surjyo": "সূৰ্য",
  "belie": "বেলি",
  "beli": "বেলি",
  "aakash": "আকাশ",
  "akash": "আকাশ",
  "pora": "পৰা",
  "loi": "লৈ",
  "majot": "মাজত",
  "logot": "লগত",
  "aru": "আৰু",
  "ba": "বা",
  "kintu": "কিন্তু",
  "karon": "কাৰণ",
  "jot": "যত",
  "tot": "তত",
  "kot": "ক’ত",
};

// Vowel Matras following a consonant
const MATRAS: Record<string, string> = {
  "aa": "া",
  "a": "া",
  "i": "ি",
  "ee": "ী",
  "I": "ী",
  "u": "ু",
  "oo": "ূ",
  "U": "ূ",
  "ri": "ৃ",
  "e": "ে",
  "oi": "ৈ",
  "ai": "ৈ",
  "o": "ো",
  "O": "ো",
  "ou": "ৌ",
  "au": "ৌ",
};

// Independent vowels at the start of a syllable or word
const VOWELS: Record<string, string> = {
  "aa": "আ",
  "a": "অ",
  "o": "অ",
  "i": "ই",
  "ee": "ঈ",
  "I": "ঈ",
  "u": "উ",
  "oo": "ঊ",
  "U": "ঊ",
  "ri": "ঋ",
  "e": "এ",
  "oi": "ঐ",
  "ai": "ঐ",
  "O": "ও",
  "ou": "ঔ",
  "au": "ঔ",
};

// Multi-character consonant patterns (longest match first)
const CONSONANT_RULES: [string, string][] = [
  // 3-char
  ["khy", "ক্ষ"],
  ["kkh", "ক্ষ"],
  ["ggy", "জ্ঞ"],
  ["gny", "জ্ঞ"],
  ["chh", "ছ"],
  ["shw", "শ্ব"],
  ["shn", "শ্ন"],
  // 2-char
  ["kh", "খ"],
  ["gh", "ঘ"],
  ["ng", "ঙ"],
  ["ch", "চ"],
  ["jh", "ঝ"],
  ["th", "থ"],
  ["Th", "ঠ"],
  ["dh", "ধ"],
  ["Dh", "ঢ"],
  ["ph", "ফ"],
  ["bh", "ভ"],
  ["sh", "শ"],
  ["Sh", "ষ"],
  ["rh", "ঢ়"],
  ["Rh", "ঢ়"],
  ["tr", "ত্ৰ"],
  ["pr", "প্ৰ"],
  ["kr", "ক্ৰ"],
  ["br", "ব্ৰ"],
  ["dr", "দ্ৰ"],
  ["gr", "গ্ৰ"],
  ["gy", "জ্ঞ"],
  ["kt", "ক্ত"],
  ["st", "স্ত"],
  ["sp", "স্প"],
  ["sk", "স্ক"],
  ["nt", "ন্ত"],
  ["nd", "ন্দ"],
  ["mp", "ম্প"],
  ["mb", "ম্ব"],
  ["mm", "ম্ম"],
  ["ll", "ল্ল"],
  ["tt", "ত্ত"],
  ["dd", "দ্দ"],
  ["bb", "ব্ব"],
  ["kk", "ক্ক"],
  ["gg", "জ্ঞ"],
  // Single char
  ["k", "ক"],
  ["g", "গ"],
  ["c", "চ"],
  ["j", "জ"],
  ["z", "য"],
  ["t", "ত"],
  ["T", "ট"],
  ["d", "দ"],
  ["D", "ড"],
  ["n", "ন"],
  ["N", "ণ"],
  ["p", "প"],
  ["f", "ফ"],
  ["b", "ব"],
  ["v", "ভ"],
  ["m", "ম"],
  ["y", "য়"],
  ["Y", "য"],
  ["r", "ৰ"],
  ["l", "ল"],
  ["w", "ৱ"],
  ["x", "শ"],
  ["s", "স"],
  ["S", "ষ"],
  ["h", "হ"],
  ["R", "ড়"],
];

/**
 * Transliterates a single romanized word to Assamese script
 */
export function transliterateWordToAssamese(word: string): string {
  if (!word) return "";

  const lower = word.toLowerCase();
  if (COMMON_WORDS[lower]) {
    return COMMON_WORDS[lower];
  }

  let result = "";
  let i = 0;
  const len = word.length;
  let prevWasConsonant = false;

  while (i < len) {
    const char = word[i];

    // Non-alphabet
    if (!/[a-zA-Z]/.test(char)) {
      result += char;
      i++;
      prevWasConsonant = false;
      continue;
    }

    // Try consonant match
    let matchedCons: string | null = null;
    let matchLen = 0;

    for (const [pattern, cons] of CONSONANT_RULES) {
      if (word.substr(i, pattern.length).toLowerCase() === pattern.toLowerCase()) {
        matchedCons = cons;
        matchLen = pattern.length;
        break;
      }
    }

    if (matchedCons) {
      i += matchLen;
      prevWasConsonant = true;

      // Look ahead for vowel matra
      const remaining = word.substr(i).toLowerCase();
      let matchedMatra: string | null = null;
      let vLen = 0;

      // 2-letter vowel matras
      if (remaining.startsWith("aa") || remaining.startsWith("ee") || remaining.startsWith("oo") || remaining.startsWith("oi") || remaining.startsWith("ai") || remaining.startsWith("ou") || remaining.startsWith("au") || remaining.startsWith("ri")) {
        const vKey = remaining.substr(0, 2);
        matchedMatra = MATRAS[vKey] ?? "";
        vLen = 2;
      } else if (remaining.length > 0 && /[aeiou]/.test(remaining[0])) {
        // Special case: 'o' at end of word or following matra
        const vKey = remaining[0];
        matchedMatra = MATRAS[vKey] ?? "";
        vLen = 1;
      }

      if (matchedMatra !== null) {
        result += matchedCons + matchedMatra;
        i += vLen;
        prevWasConsonant = false;

        // Check if diphthong vowel follows, e.g. "pao" -> "পা" + "ও"
        if (matchedMatra === "া" && word.substr(i).toLowerCase().startsWith("o")) {
          result += "ও";
          i += 1;
        } else if (matchedMatra === "া" && word.substr(i).toLowerCase().startsWith("i")) {
          result += "ই";
          i += 1;
        } else if (matchedMatra === "ো" && word.substr(i).toLowerCase().startsWith("i")) {
          result += "ই";
          i += 1;
        }
      } else {
        // No vowel immediately follows this consonant
        const nextRem = word.substr(i);
        if (nextRem.length > 0 && /[a-zA-Z]/.test(nextRem[0])) {
          // another consonant follows -> conjunct hasanta
          result += matchedCons + "্";
        } else {
          // Word end without explicit vowel
          result += matchedCons;
        }
      }
    } else {
      // Independent vowel
      let matchedVowel: string | null = null;
      let vLen = 0;
      const rem = word.substr(i).toLowerCase();

      if (rem.startsWith("aa") || rem.startsWith("ee") || rem.startsWith("oo") || rem.startsWith("oi") || rem.startsWith("ai") || rem.startsWith("ou") || rem.startsWith("au") || rem.startsWith("ri")) {
        matchedVowel = VOWELS[rem.substr(0, 2)];
        vLen = 2;
      } else if (/[aeiou]/.test(rem[0])) {
        matchedVowel = VOWELS[rem[0]];
        vLen = 1;
      }

      if (matchedVowel) {
        result += matchedVowel;
        i += vLen;
      } else {
        result += char;
        i++;
      }
      prevWasConsonant = false;
    }
  }

  // Clean trailing hasanta if word ended abruptly
  result = result.replace(/্$/, "");
  return result;
}

/**
 * Transliterates a full string (sentences, paragraphs) to Assamese
 */
export function transliterateTextToAssamese(text: string): string {
  if (!text) return "";

  return text.replace(/[a-zA-Z]+/g, (match) => {
    return transliterateWordToAssamese(match);
  });
}
