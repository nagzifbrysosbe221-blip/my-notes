import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Tabs from "./tabs";

const formatDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export default async function SubchapterDetail({
  params,
}: {
  params: Promise<{ subId: string }>;
}) {
  const { subId } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const sub = await prisma.subchapter.findFirst({
    where: {
      id: subId,
      ...(userId ? { chapter: { book: { ownerId: userId } } } : {}),
    },
    include: {
      chapter: {
        select: {
          id: true,
          title: true,
          book: { select: { id: true, title: true } },
        },
      },
    },
  });

  if (!sub) return <div>Not found</div>;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-violet-50 via-white to-sky-50 p-6 dark:border-zinc-800 dark:from-violet-500/10 dark:via-zinc-950 dark:to-sky-500/10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-violet-500">
          <Link href={`/books/${sub.chapter.book.id}`} className="hover:underline">
            {sub.chapter.book.title}
          </Link>
          <Link href={`/chapters/${sub.chapter.id}`} className="text-slate-500 hover:underline dark:text-zinc-300">
            Back to chapter
          </Link>
        </div>
        <h1 className="mt-3 text-3xl font-semibold">{sub.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">
          Practice MCQs, short answers, and creative prompts for this lesson. Track progress and stay in flow with focused tabs.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-white/60 dark:bg-zinc-900/70 dark:ring-white/5">
            <p className="text-slate-500 dark:text-zinc-400">Active mode</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">MCQ</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-white/60 dark:bg-zinc-900/70 dark:ring-white/5">
            <p className="text-slate-500 dark:text-zinc-400">Cards due</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">--</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-white/60 dark:bg-zinc-900/70 dark:ring-white/5">
            <p className="text-slate-500 dark:text-zinc-400">Created</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">
              {formatDate.format(sub.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <Tabs subId={sub.id} />
    </div>
  );
}
