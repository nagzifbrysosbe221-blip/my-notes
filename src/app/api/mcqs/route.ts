import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseConceptTypeList, normalizeConceptType } from "@/lib/concept-types";
import type { ConceptType, Prisma } from "@prisma/client";

type CreateBody = {
  subchapterId: string;
  stem: string; // question prompt
  choices: Array<
    | string
    | {
        text: string;
        explanation?: string | null;
      }
  >;
  correct: number; // index in choices (0-based)
  concepts?: string[] | null; // optional free-form tags
  conceptType: ConceptType;
  explanation?: string | null; // overall explanation for correct answer
};

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { subchapterId, stem, choices, correct, concepts, explanation, conceptType } = body;
  if (!subchapterId) return new Response("subchapterId is required", { status: 400 });
  if (!stem || typeof stem !== "string") return new Response("stem is required", { status: 400 });
  if (!Array.isArray(choices) || choices.length < 2)
    return new Response("choices must be an array with at least two", { status: 400 });
  if (typeof correct !== "number" || correct < 0 || correct >= choices.length)
    return new Response("correct must be a valid index into choices", { status: 400 });
  const normalizedConceptType = normalizeConceptType(conceptType);
  if (!normalizedConceptType) {
    return new Response("conceptType is required and must be one of CORE, INTERMEDIATE, ADVANCED, PERIPHERAL, MISC", {
      status: 400,
    });
  }

  const sub = await prisma.subchapter.findUnique({
    where: { id: subchapterId },
    include: { chapter: { include: { book: { select: { ownerId: true } } } } },
  });
  if (!sub || sub.chapter.book.ownerId !== userId) return new Response("Not found", { status: 404 });

  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const normalized = choices.map((c, idx) => {
    const asObj = typeof c === "string" ? { text: c } : c;
    return {
      label: labels[idx] ?? String(idx + 1),
      text: String(asObj.text ?? ""),
      isCorrect: idx === correct,
      explanation: asObj.explanation ?? null,
    };
  });

  const conceptsJson: Prisma.JsonArray | undefined = Array.isArray(concepts) ? (concepts as Prisma.JsonArray) : undefined;

  const created = await prisma.mCQQuestion.create({
    data: {
      subchapterId,
      prompt: stem,
      explanation: explanation ?? null,
      conceptType: normalizedConceptType,
      concepts: conceptsJson,
      choices: { create: normalized },
    },
    include: { choices: true },
  });

  return Response.json(created, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const subchapterId = url.searchParams.get("subchapterId");
  if (!subchapterId) return new Response("subchapterId is required", { status: 400 });
  const conceptTypes = url.searchParams.get("conceptTypes");
  const practiceMode = (url.searchParams.get("practiceMode") as "all" | "ignore_learned" | "mixed" | null) ?? "all";

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
    include: { choices: { orderBy: { label: "asc" } } },
  });
  if (practiceMode === "all") return Response.json(items);

  const ids = items.map((i) => i.id);
  const progress = await prisma.mCQProgress.findMany({
    where: { userId, questionId: { in: ids } },
    select: { questionId: true, isLearned: true },
  });
  const learnedSet = new Set(progress.filter((p) => p.isLearned).map((p) => p.questionId));

  if (practiceMode === "ignore_learned") {
    const filtered = items.filter((i) => !learnedSet.has(i.id));
    return Response.json(filtered);
  }

  if (practiceMode === "mixed") {
    const unlearned = items.filter((i) => !learnedSet.has(i.id));
    const learned = items.filter((i) => learnedSet.has(i.id));
    const targetLearned = Math.max(1, Math.floor(unlearned.length * 0.2));
    const mixed = [...unlearned, ...learned.slice(0, targetLearned)];
    return Response.json(mixed);
  }

  return Response.json(items);
}
