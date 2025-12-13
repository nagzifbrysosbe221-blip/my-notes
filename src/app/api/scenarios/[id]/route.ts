import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const q = await prisma.scenarioQuestion.findUnique({
    where: { id },
    include: { subchapter: { include: { chapter: { include: { book: { select: { ownerId: true } } } } } } },
  });
  if (!q || q.subchapter.chapter.book.ownerId !== userId) return new Response("Not found", { status: 404 });

  await prisma.$transaction([
    prisma.scenarioProgress.deleteMany({ where: { questionId: id } }),
    prisma.scenarioQuestion.delete({ where: { id } }),
  ]);
  return new Response(null, { status: 204 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const q = await prisma.scenarioQuestion.findUnique({
    where: { id },
    include: { subchapter: { include: { chapter: { include: { book: { select: { ownerId: true } } } } } } },
  });
  if (!q || q.subchapter.chapter.book.ownerId !== userId) return new Response("Not found", { status: 404 });

  let body: { status?: "LEARNED" | "NEW" | "IN_PROGRESS" };
  try {
    body = (await req.json()) as { status?: "LEARNED" | "NEW" | "IN_PROGRESS" };
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const { status } = body || {};
  if (!status) return new Response("status is required", { status: 400 });

  if (status === "NEW") {
    await prisma.scenarioProgress.upsert({
      where: { userId_questionId: { userId, questionId: id } },
      update: { seenCount: 0, correctCount: 0, isLearned: false, lastReviewedAt: null },
      create: { userId, questionId: id, seenCount: 0, correctCount: 0, isLearned: false },
    });
  } else if (status === "LEARNED") {
    await prisma.scenarioProgress.upsert({
      where: { userId_questionId: { userId, questionId: id } },
      update: { isLearned: true, seenCount: { set: 3 }, correctCount: { set: 3 } },
      create: { userId, questionId: id, isLearned: true, seenCount: 3, correctCount: 3 },
    });
  } else if (status === "IN_PROGRESS") {
    const existing = await prisma.scenarioProgress.findUnique({ where: { userId_questionId: { userId, questionId: id } } });
    if (!existing) {
      await prisma.scenarioProgress.create({ data: { userId, questionId: id, seenCount: 1, correctCount: 0, isLearned: false } });
    } else {
      await prisma.scenarioProgress.update({ where: { userId_questionId: { userId, questionId: id } }, data: { isLearned: false } });
    }
  }

  return Response.json({ ok: true });
}
