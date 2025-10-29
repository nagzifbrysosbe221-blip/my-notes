import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = [
  "CORE",
  "INTERMEDIATE",
  "ADVANCED",
  "PERIPHERAL",
  "MISC",
] as const;

type NoteType = (typeof ALLOWED_TYPES)[number];

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { subchapterId, type, contentJSON, title } = (body ?? {}) as {
    subchapterId?: string;
    type?: string;
    contentJSON?: unknown;
    title?: string | null;
  };

  if (!subchapterId) return new Response("subchapterId is required", { status: 400 });
  if (!type || !ALLOWED_TYPES.includes(type as NoteType)) {
    return new Response(
      `type must be one of: ${ALLOWED_TYPES.join(", ")}`,
      { status: 400 }
    );
  }

  // Ensure subchapter belongs to the authenticated user through book.ownerId
  const sub = await prisma.subchapter.findUnique({
    where: { id: subchapterId },
    include: {
      chapter: { include: { book: { select: { ownerId: true } } } },
    },
  });
  if (!sub || sub.chapter.book.ownerId !== userId) {
    return new Response("Not found", { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      subchapterId,
      type: type as NoteType,
      title: typeof title === "string" && title.trim() ? title.trim() : null,
      blocksJson: contentJSON ?? null,
    },
  });

  return Response.json(note, { status: 201 });
}

