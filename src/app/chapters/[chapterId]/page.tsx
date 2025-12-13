import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewSubchapter from "./_new-sub";
import SubList from "./_sub-list";

const formatDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export default async function ChapterDetail({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const session = await getSession();
  const userId = session?.user?.id;

  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      ...(userId ? { book: { ownerId: userId } } : {}),
    },
    include: {
      book: { select: { id: true, title: true } },
    },
  });

  if (!chapter) {
    return <div>Not found</div>;
  }

  const subchapters = await prisma.subchapter.findMany({
    where: { chapterId: chapter.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, createdAt: true, order: true },
  });

  const totalSubchapters = subchapters.length;
  const lastAdded = subchapters[subchapters.length - 1];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-indigo-50 p-6 dark:border-zinc-800 dark:from-emerald-500/10 dark:via-zinc-950 dark:to-indigo-500/10">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">{chapter.book.title}</p>
        <h1 className="mt-3 text-3xl font-semibold">{chapter.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-zinc-300">
          Break this chapter into subchapters so practice sessions stay focused. Use drag and drop to prioritize what to study first.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-white/60 dark:bg-zinc-900/70 dark:ring-white/5">
            <p className="text-slate-500 dark:text-zinc-400">Subchapters</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">{totalSubchapters}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-white/60 dark:bg-zinc-900/70 dark:ring-white/5">
            <p className="text-slate-500 dark:text-zinc-400">Chapter created</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">
              {formatDate.format(chapter.createdAt)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-white/60 dark:bg-zinc-900/70 dark:ring-white/5">
            <p className="text-slate-500 dark:text-zinc-400">Last subchapter</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">
              {lastAdded ? formatDate.format(lastAdded.createdAt) : "--"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Subchapters</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-50">Organize your lesson plan</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {totalSubchapters === 0 ? "No subchapters yet" : `${totalSubchapters} ready to study`}
            </p>
          </div>

          <SubList
            chapterId={chapter.id}
            items={subchapters.map((s) => ({
              id: s.id,
              title: s.title,
              createdAt: s.createdAt.toISOString(),
            }))}
          />
        </div>

        <NewSubchapter chapterId={chapter.id} variant="panel" />
      </div>
    </div>
  );
}
