import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const subchapterId = searchParams.get("subchapterId") || undefined;
  if (!subchapterId) return new Response("subchapterId is required", { status: 400 });
  const conceptCsv = searchParams.get("conceptTypes") || "";
  const conceptList = conceptCsv
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const sub = await prisma.subchapter.findUnique({
    where: { id: subchapterId },
    include: { chapter: { include: { book: { select: { ownerId: true } } } } },
  });
  if (!sub || sub.chapter.book.ownerId !== userId) return new Response("Not found", { status: 404 });

  const where: any = { subchapterId };
  if (conceptList.length) where.conceptType = { in: conceptList };

  const items = await prisma.shortQuestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, prompt: true, answer: true, conceptType: true, createdAt: true },
  });

  return Response.json({ items });
}

