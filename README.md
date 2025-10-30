# My Notes (MCQ Focus)

An authenticated study workspace focused on MCQ practice, built with Next.js App Router and Prisma. Users create books → chapters → subchapters and attach MCQs for practice and review.

## Getting Started

Install dependencies and launch the development server:

```
pnpm install
pnpm dev
```

Visit http://localhost:3000 to sign in with the development email flow and access your dashboard.

Database setup (SQLite by default):

```
pnpm prisma generate
pnpm prisma db push
# optional seed
pnpm tsx prisma/seed.ts
```

## Current Features

- Email-only development login powered by NextAuth.
- CRUD flows for books, chapters, and subchapters with ownership enforcement.
- Subchapter page provides MCQ Practice and CSV Import tabs.
- MCQ API endpoints:
  - POST `/api/mcqs` — create a question
  - GET `/api/mcqs?subchapterId=...` — list questions for a subchapter
  - POST `/api/mcqs/import` — bulk import from CSV

## Project Structure Highlights

- `src/app/books` — book listing, creation, and chapter management.
- `src/app/chapters/[chapterId]` — chapter detail and subchapter management.
- `src/app/subchapters/[subId]` — subchapter detail, MCQ Practice and CSV Import.
- `src/app/api/mcqs` — MCQ create/list API.
- `src/app/api/mcqs/import` — MCQ CSV import API.
- `src/app/api` — REST handlers for books, chapters, subchapters, and auth.
- `src/lib/auth.ts` — NextAuth configuration with typed sessions.
- `prisma/schema.prisma` — models: User, Book, Chapter, Subchapter, MCQQuestion, MCQChoice.

## MCQ API Details

- Create question POST `/api/mcqs`
  - Body: `{ subchapterId: string, stem: string, choices: (string | { text: string, explanation?: string })[], correct: number, conceptType: 'CORE'|'INTERMEDIATE'|'ADVANCED'|'PERIPHERAL'|'MISC', concepts?: string[], explanation?: string }`
  - `correct` is the 0-based index in `choices`.

- List questions GET `/api/mcqs?subchapterId=...`

- CSV import POST `/api/mcqs/import`
  - Body: `{ subchapterId: string, csv: string, mode?: 'preview'|'commit', indices?: number[], conceptType: 'CORE'|'INTERMEDIATE'|'ADVANCED'|'PERIPHERAL'|'MISC' }`
  - Delimiters: columns separated by `|`, rows separated by `@`.
  - Expected headers: `stem|choiceA|expA|choiceB|expB|choiceC|expC|choiceD|expD|correct|explanation@`
  - Concept category is chosen in the UI dropdown and applied to all imported cards.
  - `correct` supports A/B/C label, numeric index, or exact choice text.

- Practice filtering
  - GET `/api/mcqs?subchapterId=...&conceptTypes=CORE,MISC&practiceMode=all|ignore_learned|mixed`
  - `conceptTypes` optional CSV of categories; `practiceMode` controls learned/unlearned mix.

## UI Behavior

- Practice: questions and choices are shuffled; selecting a choice reveals its explanation; "Reveal Correct" shows the correct answer with overall explanation.
- Import: paste CSV and import; a sample format is shown in the UI.

## Notes Removed

Notes functionality and the `Note` model have been removed. The app now focuses on MCQs per subchapter.
