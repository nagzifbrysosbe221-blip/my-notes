import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseConceptTypeList } from "@/lib/concept-types";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const subchapterId = url.searchParams.get("subchapterId");
  if (!subchapterId) return new Response("subchapterId is required", { status: 400 });
  const conceptTypes = url.searchParams.get("conceptTypes");

  const sub = await prisma.subchapter.findUnique({
    where: { id: subchapterId },
    include: { chapter: { include: { book: { select: { ownerId: true } } } } },
  });
  if (!sub || sub.chapter.book.ownerId !== userId) return new Response("Not found", { status: 404 });

  const where: Prisma.MCQQuestionWhereInput = { subchapterId };
  const list = parseConceptTypeList(conceptTypes);
  if (list.length > 0) where.conceptType = { in: list };

  const items = await prisma.mCQQuestion.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      progress: { where: { userId }, select: { seenCount: true, correctCount: true, isLearned: true, lastReviewedAt: true } },
    },
  });

  const mapped = items.map((q) => {
    const p = q.progress[0] || null;
    const status = p?.isLearned ? "LEARNED" : p && p.seenCount > 0 ? "IN_PROGRESS" : "NEW";
    return {
      id: q.id,
      prompt: q.prompt,
      conceptType: q.conceptType,
      stats: {
        seenCount: p?.seenCount ?? 0,
        correctCount: p?.correctCount ?? 0,
        isLearned: !!p?.isLearned,
        lastReviewedAt: p?.lastReviewedAt ?? null,
        status,
      },
    };
  });

  const summary = mapped.reduce(
    (acc, m) => {
      acc.total += 1;
      if (m.stats.status === "LEARNED") acc.learned += 1;
      else if (m.stats.status === "IN_PROGRESS") acc.inProgress += 1;
      else acc.new += 1;
      return acc;
    },
    { total: 0, learned: 0, inProgress: 0, new: 0 }
  );

  return Response.json({ summary, items: mapped });
}
