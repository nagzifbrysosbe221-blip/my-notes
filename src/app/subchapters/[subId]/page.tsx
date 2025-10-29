import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Tabs from "./tabs";

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
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">{sub.chapter.book.title} › {sub.chapter.title}</p>
        <h1 className="text-2xl font-semibold">{sub.title}</h1>
      </div>

      <Tabs subId={sub.id} />
    </div>
  );
}

