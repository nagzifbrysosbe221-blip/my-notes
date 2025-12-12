import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import NewChapter from "./_new-chapter";
import ChapterItem from "./ChapterItem";

const formatDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export default async function BookDetail({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const book = await prisma.book.findFirst({
    where: { id: bookId, ...(userId ? { ownerId: userId } : {}) },
  });
  if (!book) return <div>Not found</div>;

  const chapterData = await prisma.chapter.findMany({
    where: { bookId: book.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { subchapters: true } },
    },
  });

  const chapters = chapterData.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
    subCount: c._count.subchapters,
  }));

  const totalChapters = chapters.length;
  const lastChapter = chapterData[chapterData.length - 1];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-6 dark:border-zinc-800 dark:from-indigo-500/10 dark:via-zinc-950 dark:to-emerald-500/10">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">Book overview</p>
        <h1 className="mt-3 text-3xl font-semibold">{book.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">
          Chapters keep this subject organized. Break topics into subchapters so study sessions feel manageable.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-white/50 dark:bg-zinc-900/70 dark:ring-white/5">
            <p className="text-slate-500 dark:text-zinc-400">Total chapters</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">{totalChapters}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-white/50 dark:bg-zinc-900/70 dark:ring-white/5">
            <p className="text-slate-500 dark:text-zinc-400">Book created</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">
              {formatDate.format(book.createdAt)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-white/50 dark:bg-zinc-900/70 dark:ring-white/5">
            <p className="text-slate-500 dark:text-zinc-400">Last chapter added</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">
              {lastChapter ? formatDate.format(lastChapter.createdAt) : "--"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Chapters</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-50">Outline your topics</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {totalChapters === 0 ? "Nothing here yet" : `${totalChapters} chapters listed`}
            </p>
          </div>
          {chapters.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
              <p className="text-lg font-semibold text-slate-900 dark:text-zinc-50">No chapters yet</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                Start by adding a chapter for each major topic. You can reorder and add subchapters any time.
              </p>
            </div>
          ) : (
            <ol className="space-y-4">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <ChapterItem chapter={c} index={i} />
                </li>
              ))}
            </ol>
          )}
        </div>
        <NewChapter bookId={book.id} variant="panel" />
      </div>
    </div>
  );
}
