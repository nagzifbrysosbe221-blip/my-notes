import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  let body: { chapterId?: string; order?: string[] };
  try {
    body = (await req.json()) as any;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const { chapterId, order } = body || {};
  if (!chapterId) return new Response("chapterId is required", { status: 400 });
  if (!Array.isArray(order) || order.length === 0) return new Response("order is required", { status: 400 });

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, book: { ownerId: userId } },
    select: { id: true },
  });
  if (!chapter) return new Response("Not found", { status: 404 });

  const subs = await prisma.subchapter.findMany({ where: { chapterId } });
  const validIds = new Set(subs.map((s) => s.id));
  if (!order.every((id) => validIds.has(id))) return new Response("order contains invalid subchapter id(s)", { status: 400 });

  // Apply sequential order starting at 0
  await prisma.$transaction(
    order.map((id, idx) => prisma.subchapter.update({ where: { id }, data: { order: idx } }))
  );

  return Response.json({ ok: true });
}

