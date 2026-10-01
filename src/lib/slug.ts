/**
 * Slug generation utility supporting English and Assamese.
 * Never produces empty or percent-encoded slugs.
 */

// Basic romanization mapping for Assamese / Bengali Unicode characters
const ASSAMESE_TRANSLIT_MAP: Record<string, string> = {
  // Vowels
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'ee', 'উ': 'u', 'ঊ': 'oo', 'ঋ': 'ri',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  // Vowel signs (matras)
  'া': 'a', 'ি': 'i', 'ী': 'ee', 'ু': 'u', 'ূ': 'oo', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  // Consonants
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'z', 'ৰ': 'r', 'ল': 'l', 'ৱ': 'w',
  'শ': 'x', 'ষ': 'x', 'স': 'x', 'হ': 'h',
  'ক্ষ': 'khy', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
  // Modifiers
  'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
  // Digits
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export function transliterateAssamese(text: string): string {
  let result = '';
  for (const char of text) {
    if (ASSAMESE_TRANSLIT_MAP[char]) {
      result += ASSAMESE_TRANSLIT_MAP[char];
    } else {
      result += char;
    }
  }
  return result;
}

export function generateSlug(title: string, customSuffix?: string): string {
  if (!title || typeof title !== 'string') {
    return `post-${Date.now()}`;
  }

  // First transliterate any Assamese/Bengali characters
  const transliterated = transliterateAssamese(title);

  // Normalize, convert to lowercase, replace accented Latin characters
  let slug = transliterated
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-latin and non-alphanumeric chars
    .replace(/[\s_-]+/g, '-')     // collapse whitespace and dashes
    .replace(/^-+|-+$/g, '');     // trim leading and trailing dashes

  // If slug is empty or too short, generate a clean fallback
  if (!slug || slug.length < 2) {
    const dateStr = new Date().toISOString().slice(0, 10);
    const randomHex = Math.random().toString(36).substring(2, 8);
    slug = `post-${dateStr}-${randomHex}`;
  }

  // Truncate to reasonable length (max 80 chars) without breaking a word
  if (slug.length > 80) {
    slug = slug.substring(0, 80).replace(/-[^-]*$/, '');
  }

  if (customSuffix) {
    slug = `${slug}-${customSuffix}`;
  }

  return slug;
}
