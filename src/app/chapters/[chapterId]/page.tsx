import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewSubchapter from "./_new-sub";
import SubItem from "./SubItem";

export default async function ChapterDetail({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const session = await auth();
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
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{chapter.book.title}</p>
          <h1 className="text-2xl font-semibold">{chapter.title}</h1>
        </div>
        <NewSubchapter chapterId={chapter.id} />
      </div>

      <div className="space-y-2">
        {subchapters.map((sub, i) => (
          <SubItem key={sub.id} subchapter={sub} index={i} />
        ))}
      </div>

      {subchapters.length === 0 && (
        <p className="text-sm text-zinc-500">No subchapters yet.</p>
      )}
    </div>
  );
}
