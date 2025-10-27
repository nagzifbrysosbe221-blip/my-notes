import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { chapterId, title } = await req.json();
  if (!chapterId) return new Response("chapterId is required", { status: 400 });

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, book: { ownerId: userId } },
    select: { id: true },
  });
  if (!chapter) return new Response("Chapter not found", { status: 404 });

  const count = await prisma.subchapter.count({ where: { chapterId } });
  const safeTitle: string =
    typeof title === "string" && title.trim()
      ? title.trim()
      : `Subchapter ${count + 1}`;

  const subchapter = await prisma.subchapter.create({
    data: {
      chapterId,
      title: safeTitle,
    },
  });

  return Response.json(subchapter, { status: 201 });
}
