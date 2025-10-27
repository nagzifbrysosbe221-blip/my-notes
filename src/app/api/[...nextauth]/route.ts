import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// List books for the signed-in user
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const books = await prisma.book.findMany({
    where: userId ? { ownerId: userId } : undefined, // if your model requires ownerId, userId will always exist here
    orderBy: { createdAt: "desc" },
  });

  return Response.json(books);
}

// Create a new book owned by the signed-in user
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { title } = await req.json();
  if (!title || typeof title !== "string") {
    return new Response("Title is required", { status: 400 });
  }

  // If your Prisma model has: model Book { ownerId String @db...  user User @relation(fields: [ownerId], references: [id]) }
  const book = await prisma.book.create({
    data: { title: title.trim(), ownerId: userId },
  });

  return Response.json(book, { status: 201 });
}



