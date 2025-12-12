import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import NewBook from "./_new-book";

const formatDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export default async function BooksPage() {
  const session = await auth();
  const userId = (session as any)?.userId;

  const books = await prisma.book.findMany({
    where: userId ? { ownerId: userId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { chapters: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-100 via-white to-emerald-50 p-6 dark:border-zinc-800 dark:from-indigo-500/10 dark:via-zinc-950 dark:to-emerald-500/10">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">Library</p>
          <h1 className="mt-3 text-3xl font-semibold">All of your study books</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-zinc-300">
            Organize chapters, create subchapters, and keep track of what needs your attention next. Every book becomes a focused workspace.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/70 p-3 text-sm shadow-sm ring-1 ring-white/60 dark:bg-zinc-900/70 dark:ring-white/10">
              <p className="text-slate-500 dark:text-zinc-400">Total books</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">{books.length}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 text-sm shadow-sm ring-1 ring-white/60 dark:bg-zinc-900/70 dark:ring-white/10">
              <p className="text-slate-500 dark:text-zinc-400">Chapters tracked</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">
                {books.reduce((sum, b) => sum + b._count.chapters, 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 text-sm shadow-sm ring-1 ring-white/60 dark:bg-zinc-900/70 dark:ring-white/10">
              <p className="text-slate-500 dark:text-zinc-400">Last created</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">
                {books[0] ? formatDate.format(books[0].createdAt) : "--"}
              </p>
            </div>
          </div>
        </div>
        <NewBook />
      </div>

      {books.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/60">
          <p className="text-lg font-semibold">Let's create your first book</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            Books keep related chapters together. Use them for subjects, exams, or big projects.
          </p>
          <div className="mt-6 flex justify-center">
            <NewBook compact />
          </div>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {books.map((b) => (
            <li
              key={b.id}
              className="group rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm ring-1 ring-transparent transition hover:-translate-y-0.5 hover:border-indigo-200 hover:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-500/30 dark:hover:ring-indigo-500/20"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Study book</p>
                  <Link href={`/books/${b.id}`} className="mt-1 inline-flex text-xl font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-zinc-50">
                    {b.title}
                  </Link>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                  {b._count.chapters} chapters
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-zinc-400">
                Created {formatDate.format(b.createdAt)} - Draft your chapters and subchapters to keep this subject on track.
              </p>
              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-zinc-400">Continue planning</span>
                <Link href={`/books/${b.id}`} className="font-medium text-indigo-600 transition group-hover:text-indigo-700 dark:text-indigo-300">
                  Open book &rarr;
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
