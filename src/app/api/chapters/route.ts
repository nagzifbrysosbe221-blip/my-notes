import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { bookId, title } = await req.json();
  if (!bookId) return new Response("bookId is required", { status: 400 });

  // Ensure the book belongs to the user
  const book = await prisma.book.findFirst({
    where: { id: bookId, ownerId: userId },
    select: { id: true },
  });
  if (!book) return new Response("Book not found", { status: 404 });

  // Decide a title:
  // - Use provided title if present
  // - Else auto-generate "Chapter N" based on how many already exist
  const count = await prisma.chapter.count({ where: { bookId } });
  const safeTitle: string =
    typeof title === "string" && title.trim()
      ? title.trim()
      : `Chapter ${count + 1}`;

  // If your schema also requires other fields (e.g., description), add them here.
  // We only set the required ones: bookId + title
  const chapter = await prisma.chapter.create({
    data: {
      bookId,
      title: safeTitle,
      // If you later add 'index' to your schema:
      // index: count + 1,
    },
  });

  return Response.json(chapter, { status: 201 });
}
