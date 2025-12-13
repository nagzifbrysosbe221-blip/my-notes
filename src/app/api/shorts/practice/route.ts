import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Body = { questionId?: string; correct?: boolean };

export async function POST(req: Request) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { questionId, correct } = body || {};
  if (!questionId) return new Response("questionId is required", { status: 400 });

  const q = await prisma.shortQuestion.findUnique({
    where: { id: questionId },
    include: { subchapter: { include: { chapter: { include: { book: { select: { ownerId: true } } } } } } },
  });
  if (!q || q.subchapter.chapter.book.ownerId !== userId) return new Response("Not found", { status: 404 });

  const now = new Date();
  const updated = await prisma.shortProgress.upsert({
    where: { userId_questionId: { userId, questionId } },
    update: {
      seenCount: { increment: 1 },
      correctCount: correct ? { increment: 1 } : undefined,
      lastReviewedAt: now,
    },
    create: {
      userId,
      questionId,
      seenCount: 1,
      correctCount: correct ? 1 : 0,
      lastReviewedAt: now,
    },
  });

  const isLearned = updated.correctCount >= 3;
  if (updated.isLearned !== isLearned) {
    await prisma.shortProgress.update({
      where: { userId_questionId: { userId, questionId } },
      data: { isLearned },
    });
  }

  return Response.json({ ok: true });
}
