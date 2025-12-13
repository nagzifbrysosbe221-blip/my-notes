// src/app/api/chapters/[chapterId]/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ chapterId: string }> } // <- params is a Promise
) {
  const { chapterId } = await ctx.params;       // <- unwrap it
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { title } = await req.json();
  const safeTitle = typeof title === "string" ? title.trim() : "";
  if (!safeTitle) return new Response("Valid title is required", { status: 400 });

  // Ensure the chapter belongs to a book owned by this user
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { book: { select: { ownerId: true } } },
  });
  if (!chapter || chapter.book.ownerId !== userId) {
    return new Response("Not found", { status: 404 });
  }

  const updated = await prisma.chapter.update({
    where: { id: chapterId },
    data: { title: safeTitle },
  });

  return Response.json(updated);
}
