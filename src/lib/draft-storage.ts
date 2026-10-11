/**
 * draft-storage.ts
 * Robust client-side draft persistence using IndexedDB with synchronous localStorage fallback.
 * Solves browser reload data loss and handles large multi-megabyte pasted images without quota errors.
 */

export interface StudioDraft {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  language: "EN" | "AS";
  tagInput: string;
  contentHtml: string;
  contentJson: object;
  timestamp: number;
}

const DB_NAME = "borkoto_studio_store";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("IndexedDB open error:", request.error);
        resolve(null);
      };
    } catch (err) {
      console.warn("IndexedDB unavailable:", err);
      resolve(null);
    }
  });
}

/**
 * Check if a draft has meaningful user content worth preserving
 */
export function hasDraftContent(draft: Partial<StudioDraft> | null | undefined): boolean {
  if (!draft) return false;
  if (draft.title && draft.title.trim().length > 0) return true;
  if (draft.excerpt && draft.excerpt.trim().length > 0) return true;
  if (draft.coverImage && draft.coverImage.trim().length > 0) return true;
  if (draft.contentHtml && draft.contentHtml.trim().length > 0 && draft.contentHtml !== "<p></p>") return true;
  if (
    draft.contentJson &&
    typeof draft.contentJson === "object" &&
    Array.isArray((draft.contentJson as { content?: unknown[] }).content) &&
    ((draft.contentJson as { content?: unknown[] }).content?.length || 0) > 0
  ) {
    return true;
  }
  return false;
}

/**
 * Synchronous save to localStorage (useful during window beforeunload)
 */
export function saveStudioDraftSync(key: string, draft: StudioDraft): void {
  if (typeof window === "undefined") return;
  try {
    const rawKey = `borkoto_post_backup_${key}`;
    localStorage.setItem(rawKey, JSON.stringify(draft));
  } catch (err) {
    // LocalStorage quota may be exceeded if draft contains large data URLs
    console.warn("localStorage quota exceeded in sync save, IndexedDB will handle persistence:", err);
  }
}

/**
 * Synchronous load from localStorage for instant mount restoration
 */
export function loadStudioDraftSync(key: string): StudioDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const rawKey = `borkoto_post_backup_${key}`;
    const legacyKey = `prof_blog_backup_${key}`;
    const raw = localStorage.getItem(rawKey) || localStorage.getItem(legacyKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as StudioDraft;
  } catch {
    return null;
  }
}

/**
 * Asynchronous save to both IndexedDB and localStorage
 */
export async function saveStudioDraft(key: string, draft: StudioDraft): Promise<void> {
  // Always try localStorage first for instant availability
  saveStudioDraftSync(key, draft);

  // Then persist to IndexedDB for unlimited capacity
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(draft, key);

        req.onsuccess = () => resolve();
        req.onerror = () => {
          console.warn("IndexedDB put error:", req.error);
          resolve();
        };
      } catch (err) {
        console.warn("IndexedDB transaction error:", err);
        resolve();
      }
    });
  } catch (err) {
    console.warn("Error saving draft to IndexedDB:", err);
  }
}

/**
 * Asynchronous load comparing IndexedDB and localStorage for the freshest timestamp
 */
export async function loadStudioDraft(key: string): Promise<StudioDraft | null> {
  const localDraft = loadStudioDraftSync(key);

  try {
    const db = await openDB();
    if (!db) return localDraft;

    const idbDraft = await new Promise<StudioDraft | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => resolve((req.result as StudioDraft) || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (!idbDraft) return localDraft;
    if (!localDraft) return idbDraft;

    // Pick the most recent draft
    return (idbDraft.timestamp || 0) >= (localDraft.timestamp || 0) ? idbDraft : localDraft;
  } catch (err) {
    console.warn("Error loading draft from IndexedDB:", err);
    return localDraft;
  }
}

/**
 * Remove draft completely from storage (e.g. after successful publish or explicit clear)
 */
export async function removeStudioDraft(key: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(`borkoto_post_backup_${key}`);
    localStorage.removeItem(`prof_blog_backup_${key}`);
  } catch {}

  try {
    const db = await openDB();
    if (!db) return;

    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {}
}
