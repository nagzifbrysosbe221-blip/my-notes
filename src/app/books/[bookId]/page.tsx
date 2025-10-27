import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import NewChapter from "./_new-chapter";
import ChapterItem from "./ChapterItem";

export default async function BookDetail({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params; // ← unwrap the Promise
  const session = await auth();
  const userId = (session as any)?.userId;

  const book = await prisma.book.findFirst({
    where: { id: bookId, ...(userId ? { ownerId: userId } : {}) },
  });
  if (!book) return <div>Not found</div>;

  const chapters = await prisma.chapter.findMany({
    where: { bookId: book.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{book.title}</h1>
        <NewChapter bookId={book.id} />
      </div>

      <div className="space-y-2">
        {chapters.map((c, i) => (
          <ChapterItem key={c.id} chapter={c} index={i} />
        ))}
      </div>

      {chapters.length === 0 && (
        <p className="text-sm text-zinc-500">No chapters yet.</p>
      )}
    </div>
  );
}


