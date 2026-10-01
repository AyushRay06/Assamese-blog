# Personal Blog Website: Project Context

> Give this file to your AI code editor as the single source of truth. Build the whole application as described. Where something is not specified, choose the simplest option that fits the constraints and leave a short comment explaining the choice.

---

## 1. Project Summary

A **personal blogging website** with exactly **one admin** (the owner). Visitors can only read blog posts. There is **no signup, login, or logout page** anywhere in the public UI. The admin writes and manages posts through a rich text editor on a protected admin area.

The blog is **bilingual**: posts can be written in **English** or **Assamese** (see section 5).

---

## 2. Tech Stack (fixed, do not substitute)

| Concern | Choice |
|---|---|
| Framework | Next.js (latest stable, App Router) |
| Language | TypeScript (strict mode), React |
| Database | PostgreSQL hosted on **Neon DB** |
| ORM | **Prisma** (use the Neon serverless-friendly setup, pooled `DATABASE_URL` plus `DIRECT_URL` for migrations) |
| Styling | **Tailwind CSS** and **shadcn/ui** |
| Rich text editor | **Tiptap** (headless, works well with shadcn styling) |
| Image storage | **Vercel Blob** (Neon is DB only; keep the upload code behind one helper so it can be swapped for Cloudinary or S3 later) |
| Validation | Zod |
| Deployment target | Vercel |

Do not add NextAuth, Clerk, or any full auth system. See section 6.

---

## 3. Core Requirements

### Public side (no auth, read only)
- Home page: list of published posts, newest first, with cover image, title, excerpt, date, language badge, reading time.
- Single post page at `/blog/[slug]` rendering the rich text content with proper typography.
- Language filter or toggle on the home page (All / English / Assamese).
- Pagination or "load more" on the list.
- SEO: dynamic metadata per post (title, description, Open Graph image), `sitemap.xml`, `robots.txt`, RSS feed at `/rss.xml`.
- Responsive, fast, accessible. Light and dark mode.
- Absolutely **no login or logout UI** and no links to the admin area in the public navigation.

### Admin side (single user)
- Admin dashboard at `/admin`: table of all posts (draft and published) with edit, delete, publish/unpublish actions.
- Create and edit post at `/admin/posts/new` and `/admin/posts/[id]/edit`.
- Rich text editor with:
  - Headings (H1 to H3), bold, italic, underline, strikethrough
  - Bullet and numbered lists, blockquote, code block, inline code
  - Links
  - Text alignment
  - **Image upload** (drag and drop, paste, or toolbar button) with alt text
  - Horizontal rule
  - Undo and redo
- Post fields: title, slug (auto generated from title, editable), excerpt, cover image, content, language, status (draft or published), published date, optional tags.
- Autosave draft (debounced) and a live preview toggle.
- Delete requires a confirmation dialog.

---

## 4. Data Model (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Language {
  EN
  AS
}

enum PostStatus {
  DRAFT
  PUBLISHED
}

model Post {
  id          String     @id @default(cuid())
  title       String
  slug        String     @unique
  excerpt     String?
  coverImage  String?
  content     Json       // Tiptap JSON document
  contentHtml String     // pre-rendered HTML for fast public rendering
  language    Language   @default(EN)
  status      PostStatus @default(DRAFT)
  publishedAt DateTime?
  readingTime Int        @default(1)
  tags        Tag[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([status, publishedAt])
  @@index([language])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]
}
```

Notes:
- Store the Tiptap JSON as the source of truth and generate sanitized HTML on save.
- Sanitize HTML on the server before storing (for example `sanitize-html` or `isomorphic-dompurify`).
- Each post is written in **one** language. Posts in different languages are independent entries (no translation linking required in v1).

---

## 5. Bilingual Support (English and Assamese)

> Assumption: the second language is **Assamese** (`as`). If the owner meant a different language, only the items marked "language config" below need to change.

- A `Language` enum on every post (`EN`, `AS`). Keep the list in a single config file (`src/lib/languages.ts`) so adding more later is trivial.
- Set `lang="as"` or `lang="en"` on the post's article element for correct screen reader and hyphenation behavior.
- **Fonts:** load **Noto Sans Bengali** (covers the Bengali-Assamese script) via `next/font/google` alongside the English font. Apply it automatically to Assamese posts through a `lang` based CSS rule.
- The editor must handle Assamese input properly: correct rendering of conjuncts, no forced uppercase, no broken word wrapping. The admin types using their OS keyboard or IME, so the editor only needs to not interfere.
- Slug generation: for Assamese titles, transliterate to Latin or fall back to a short random id plus date. Never produce empty or percent encoded slugs.
- Reading time: count words for English, and use a character based estimate for Assamese if word splitting is unreliable.
- Public UI chrome (nav, buttons, footer) stays in English in v1. Only post content is bilingual.
- Language filter on the home page via query param (`/?lang=as`).

---

## 6. Admin Protection Without a Login Page

Requirement: visitors never see a login or logout page, but the admin routes must not be open to the world.

Implement this approach:

1. **HTTP Basic Auth in Next.js middleware** guarding `/admin/*` and every admin API route (`/api/admin/*`, upload endpoint, mutation server actions).
2. Credentials come from environment variables: `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Compare using a constant time comparison.
3. The browser's native credential prompt is the only "login", so there is no custom login or logout page.
4. All write operations (create, update, delete, upload) must **re-verify authorization on the server**, not only in middleware.
5. Add basic rate limiting on admin and upload endpoints.
6. Public routes are read only and never expose drafts. Draft posts must return 404 on public routes.

Optional later upgrade (do not build now): a secret token cookie flow or passkey.

---

## 7. Suggested Project Structure

```
src/
  app/
    (public)/
      page.tsx                 # post list
      blog/[slug]/page.tsx     # single post
    admin/
      page.tsx                 # dashboard
      posts/new/page.tsx
      posts/[id]/edit/page.tsx
    api/
      admin/upload/route.ts    # image upload to Vercel Blob
    rss.xml/route.ts
    sitemap.ts
    robots.ts
  components/
    ui/                        # shadcn components
    editor/                    # Tiptap editor, toolbar, image extension
    blog/                      # PostCard, PostContent, LanguageFilter
    admin/                     # PostForm, PostsTable
  lib/
    prisma.ts                  # singleton client
    languages.ts
    slug.ts
    sanitize.ts
    auth.ts                    # basic auth helper
    validations.ts             # Zod schemas
  middleware.ts
prisma/
  schema.prisma
```

Use Server Components and Server Actions where sensible. Cache public pages with `revalidate` or on demand revalidation (`revalidatePath`) after admin changes.

---

## 8. shadcn/ui Components to Install

`button`, `input`, `textarea`, `label`, `select`, `badge`, `card`, `dialog`, `alert-dialog`, `dropdown-menu`, `table`, `tabs`, `toggle`, `toggle-group`, `separator`, `sonner` (toasts), `skeleton`, `switch`, `popover`, `tooltip`.

Also use `@tailwindcss/typography` (`prose` classes) for rendering post content.

---

## 9. Environment Variables

```
DATABASE_URL=            # Neon pooled connection string
DIRECT_URL=              # Neon direct connection string (migrations)
ADMIN_USERNAME=
ADMIN_PASSWORD=
BLOB_READ_WRITE_TOKEN=   # Vercel Blob
NEXT_PUBLIC_SITE_URL=
```

Provide a `.env.example` with these keys and no real values.

---

## 10. Non Functional Requirements

- Strict TypeScript, no `any`. ESLint clean.
- Validate all inputs with Zod on the server.
- Image uploads: accept only JPEG, PNG, WebP, GIF, AVIF; max 5 MB; generate unique filenames.
- Use `next/image` for rendered images with sensible sizes.
- Lighthouse targets: Performance, Accessibility, SEO all 90 or above on the public pages.
- Keyboard accessible editor toolbar with proper ARIA labels.

---

## 11. Build Order

1. Scaffold Next.js (TypeScript, Tailwind, App Router), init shadcn/ui, install dependencies.
2. Set up Prisma with Neon, write the schema, run the first migration.
3. Build the Prisma client singleton and data access helpers.
4. Build the public pages (list and single post) with seed data.
5. Add middleware Basic Auth for `/admin` and admin APIs.
6. Build the Tiptap editor with the toolbar and image upload to Vercel Blob.
7. Build admin dashboard and create/edit/delete flows with draft and publish.
8. Add bilingual support: language field, fonts, filter, slug fallback.
9. Add SEO, sitemap, RSS, dark mode, and polish.
10. Write a short `README.md` covering setup, env vars, and deployment.

---

## 12. Out of Scope for v1

- User registration, multiple authors, roles
- Comments, likes, newsletters
- Full UI translation (i18n of the interface)
- Linking translated versions of the same post

---

## 13. Definition of Done

- A visitor can open the site, browse and read English and Assamese posts, and sees no login or logout UI.
- The admin opens `/admin`, passes the browser auth prompt, writes a styled post with images in either language, saves a draft, publishes it, and it appears on the public blog.
- Drafts never leak publicly. Unauthorized requests to admin routes and upload endpoints are rejected.
- The app builds cleanly, migrations run against Neon, and deploys to Vercel with only the env vars above.