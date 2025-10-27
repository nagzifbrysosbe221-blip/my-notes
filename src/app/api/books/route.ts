import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { title } = await req.json();
  if (!title) return new Response("Title is required", { status: 400 });

  const book = await prisma.book.create({
    data: { title: title.trim(), ownerId: userId }, // ← requires Book.ownerId in Prisma schema
  });
  return Response.json(book, { status: 201 });
}

