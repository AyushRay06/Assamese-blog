# Minimalist Bilingual Blog (English & Assamese)

A high-performance personal blogging platform built with **Next.js (App Router)**, **TypeScript**, **PostgreSQL (Neon DB)**, **Prisma**, **Tailwind CSS**, **shadcn/ui**, and **Tiptap**.

## ✨ Features

- **True Bilingual Experience**: Full support for English and Assamese (অসমীয়া), including font loading via `Noto Sans Bengali`, language filters, and character-aware reading time calculation.
- **Clean Public Experience**: Fast, responsive, accessible, with light & dark mode. Zero login/logout UI or admin traces exposed to visitors.
- **Zero-Login Admin Protection**: Native HTTP Basic Auth guarding `/admin/*` and mutation APIs via Next.js middleware with constant-time byte comparison and server-side re-verification.
- **Rich Text Editor**: Headless Tiptap editor with headings, lists, blockquotes, code blocks, links, text alignments, image uploads (with drag-and-drop & paste support), and live markdown preview.
- **Assamese Script Support**: Proper rendering of conjuncts, non-interfering IME input, and intelligent Latin transliteration fallback for clean, readable URLs.
- **Image Storage Abstraction**: Backed by Vercel Blob with seamless local development fallback.
- **SEO & Syndication**: Dynamic Open Graph metadata, JSON-LD friendly structure, `sitemap.xml`, `robots.txt`, and full RSS 2.0 feed at `/rss.xml`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 22)
- A Neon PostgreSQL database

### 2. Installation
```bash
git clone <repo-url>
cd Blog-website
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in the values:
```env
# Neon Database Connection Strings
DATABASE_URL="postgresql://neondb_owner:...@ep-...-pooler.c-...neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:...@ep-...c-...neon.tech/neondb?sslmode=require"

# Admin Basic Auth Credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-strong-password"

# Optional Vercel Blob (leave empty in local development to use local uploads)
BLOB_READ_WRITE_TOKEN=""

# Public Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 4. Database Setup & Seeding
Push the schema to Neon and populate sample bilingual posts:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 5. Run Development Server
```bash
npm run dev
```

- Public Blog: [http://localhost:3000](http://localhost:3000)
- Admin Dashboard: [http://localhost:3000/admin](http://localhost:3000/admin) (Log in with `ADMIN_USERNAME` and `ADMIN_PASSWORD` via browser native authentication prompt)
- RSS Feed: [http://localhost:3000/rss.xml](http://localhost:3000/rss.xml)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (Strict mode) |
| Database | Neon Serverless PostgreSQL |
| ORM | Prisma 6 |
| Styling | Tailwind CSS v4 & shadcn/ui |
| Editor | Tiptap Rich Text |
| Storage | Vercel Blob (with local fallback) |
| Validation | Zod |

---

## 📦 Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables (`DATABASE_URL`, `DIRECT_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SITE_URL`).
4. Set Build Command: `prisma generate && next build`.
5. Deploy!
