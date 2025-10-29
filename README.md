# My Notes

An authenticated note-taking workspace built with Next.js App Router and Prisma. Users can create books, chapters, and now subchapters that will later hold rich study materials.

## Getting Started

Install dependencies and launch the development server:

```bash
pnpm install
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to sign in with the development email flow and access your dashboard.

## Current Features

- Email-only development login powered by NextAuth.
- CRUD flows for books and chapters with ownership enforcement.
- Chapter detail view listing subchapters with inline rename controls.
- API routes to create and rename subchapters that validate the signed-in owner.
- Subchapter detail view with tabs scaffold (Notes/Questions).
- Notes API: `POST /api/notes` accepts `{ subchapterId, type, contentJSON, title? }` and stores JSON blocks.

## Project Structure Highlights

- `src/app/books` – book listing, creation, and chapter management pages.
- `src/app/chapters/[chapterId]` – chapter detail page and client components for subchapters.
- `src/app/api` – REST-style handlers for books, chapters, and subchapters.
- `src/lib/auth.ts` – NextAuth configuration with typed sessions.

## Next Steps

- Replace the placeholder textarea with a real Tiptap editor.
- Implement MCQ, short answer, and critical thinking question flows.
- Add SRS-style scheduling and mind-map visualizations.
