import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ subId: string }> }
) {
  const { subId } = await ctx.params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { title } = await req.json();
  const safeTitle = typeof title === "string" ? title.trim() : "";
  if (!safeTitle) return new Response("Valid title is required", { status: 400 });

  const subchapter = await prisma.subchapter.findUnique({
    where: { id: subId },
    include: {
      chapter: {
        include: {
          book: { select: { ownerId: true } },
        },
      },
    },
  });

  if (!subchapter || subchapter.chapter.book.ownerId !== userId) {
    return new Response("Not found", { status: 404 });
  }

  const updated = await prisma.subchapter.update({
    where: { id: subId },
    data: { title: safeTitle },
  });

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ subId: string }> }
) {
  const { subId } = await ctx.params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const subchapter = await prisma.subchapter.findUnique({
    where: { id: subId },
    include: {
      chapter: {
        include: {
          book: { select: { ownerId: true } },
        },
      },
    },
  });

  if (!subchapter || subchapter.chapter.book.ownerId !== userId) {
    return new Response("Not found", { status: 404 });
  }

  // Prevent deletion if there are dependent questions
  const [mcqCount, shortCount, creativeCount, scenarioCount] = await Promise.all([
    prisma.mCQQuestion.count({ where: { subchapterId: subId } }),
    prisma.shortQuestion.count({ where: { subchapterId: subId } }),
    prisma.creativeQuestion.count({ where: { subchapterId: subId } }),
    prisma.scenarioQuestion.count({ where: { subchapterId: subId } }),
  ]);

  if (mcqCount + shortCount + creativeCount + scenarioCount > 0) {
    return new Response(
      "Cannot delete: subchapter has questions. Remove them first.",
      { status: 409 }
    );
  }

  await prisma.subchapter.delete({ where: { id: subId } });
  return new Response(null, { status: 204 });
}
