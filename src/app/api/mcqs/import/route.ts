import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeConceptType } from "@/lib/concept-types";
import type { ConceptType, Prisma } from "@prisma/client";

function parseCSV(input: string): string[][] {
  // Parse with '|' and '@' when present; otherwise fallback to comma/newline.
  const useCustom = input.includes("|") || input.includes("@");
  const COL = useCustom ? '|' : ',';
  const ROW = useCustom ? '@' : '\n';
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let i = 0;
  let inQuotes = false;
  while (i < input.length) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        cur += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === COL) {
        row.push(cur);
        cur = "";
        i++;
        continue;
      }
      if (ch === ROW) {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
        i++;
        continue;
      }
      if (ch === '\r') { i++; continue; }
      // Preserve other characters (including newlines) as data
      cur += ch;
      i++;
    }
  }
  row.push(cur);
  rows.push(row);
  return rows;
}

type ParsedChoice = { text: string; explanation: string | null };
type ParsedItem = {
  stem: string;
  choices: ParsedChoice[];
  correctIndex: number;
  concepts: string[];
  explanation: string | null;
};

function parseCsvToItems(csv: string): ParsedItem[] {
  const rows = parseCSV(csv).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length === 0) throw new Error("No rows found");

  const [header, ...data] = rows;
  const h = header.map((s) => s.trim().toLowerCase());
  const idx = (name: string) => h.indexOf(name);

  const items = data.map((cols) => {
    const stem = cols[idx("stem")] ?? "";
    const correct = cols[idx("correct")] ?? "";
    const explanation = idx("explanation") >= 0 ? cols[idx("explanation")] : "";
    // Concepts are not accepted via CSV anymore; dropdown decides the concept category
    const concepts: string[] = [];

    const pair = (cName: string, eName: string) => {
      const c = idx(cName) >= 0 ? cols[idx(cName)] : "";
      const e = idx(eName) >= 0 ? cols[idx(eName)] : "";
      return { text: c, explanation: e || null };
    };

    const choices = [
      pair("choicea", "expa"),
      pair("choiceb", "expb"),
      pair("choicec", "expc"),
      pair("choiced", "expd"),
      pair("choicee", "expe"),
      pair("choicef", "expf"),
    ].filter((x) => x.text && x.text.trim() !== "");

    let correctIndex = -1;
    const cNorm = String(correct).trim();
    const labelIdx = "ABCDEF".indexOf(cNorm.toUpperCase());
    if (labelIdx >= 0 && labelIdx < choices.length) correctIndex = labelIdx;
    if (correctIndex < 0 && /^\d+$/.test(cNorm)) {
      const num = parseInt(cNorm, 10);
      if (num >= 0 && num < choices.length) correctIndex = num;
    }
    if (correctIndex < 0) {
      const byText = choices.findIndex((c) => c.text === cNorm);
      if (byText >= 0) correctIndex = byText;
    }

    return { stem, choices, correctIndex, concepts, explanation: explanation || null } as ParsedItem;
  });

  const invalid = items.findIndex((i) => !i.stem || i.choices.length < 2 || i.correctIndex < 0);
  if (invalid >= 0) throw new Error(`Invalid row at index ${invalid} (after header)`);
  return items;
}

type ImportBody = {
  subchapterId?: string;
  csv?: string;
  mode?: "preview" | "commit";
  indices?: number[];
  conceptType?: ConceptType;
};

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  let body: ImportBody;
  try {
    body = (await req.json()) as ImportBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { subchapterId, csv, mode = "preview", indices, conceptType } = body || {};
  if (!subchapterId) return new Response("subchapterId is required", { status: 400 });
  if (!csv || typeof csv !== "string") return new Response("csv is required", { status: 400 });
  const normalizedConceptType = normalizeConceptType(conceptType);
  if (!normalizedConceptType) {
    return new Response("conceptType is required and must be one of CORE, INTERMEDIATE, ADVANCED, PERIPHERAL, MISC", { status: 400 });
  }

  const sub = await prisma.subchapter.findUnique({
    where: { id: subchapterId },
    include: { chapter: { include: { book: { select: { ownerId: true } } } } },
  });
  if (!sub || sub.chapter.book.ownerId !== userId) return new Response("Not found", { status: 404 });
  try {
    const items = parseCsvToItems(csv);

    if (mode === "preview") {
      // Return a display-friendly preview with labels
      const withLabels = items.map((i) => ({
        stem: i.stem,
        choices: i.choices.map((c, idx) => ({
          label: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[idx] ?? String(idx + 1),
          text: c.text,
          explanation: c.explanation,
          isCorrect: idx === i.correctIndex,
        })),
        correctIndex: i.correctIndex,
        concepts: i.concepts,
        explanation: i.explanation,
      }));
      return Response.json({ items: withLabels });
    }

    // commit mode
    if (!Array.isArray(indices) || indices.length === 0)
      return new Response("indices is required for commit", { status: 400 });

    const toCreate = indices
      .map((i) => items[i])
      .filter((x): x is ParsedItem => !!x);

    if (toCreate.length === 0) return new Response("No valid indices to import", { status: 400 });

    const created = await prisma.$transaction(
      toCreate.map((i) =>
        prisma.mCQQuestion.create({
          data: {
            subchapterId,
            prompt: i.stem,
            explanation: i.explanation || null,
            conceptType: normalizedConceptType,
            concepts: i.concepts && i.concepts.length ? (i.concepts as Prisma.JsonArray) : undefined,
            choices: {
              create: i.choices.map((c, idx) => ({
                label: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[idx] ?? String(idx + 1),
                text: c.text,
                isCorrect: idx === i.correctIndex,
                explanation: c.explanation || null,
              })),
            },
          },
          include: { choices: true },
        })
      )
    );

    return Response.json({ count: created.length });
  } catch (e) {
    return new Response((e as Error).message || "Invalid CSV", { status: 400 });
  }
}
