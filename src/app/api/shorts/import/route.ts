import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeConceptType } from "@/lib/concept-types";
import type { ConceptType } from "@prisma/client";

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
      cur += ch;
      i++;
    }
  }
  row.push(cur);
  rows.push(row);
  return rows;
}

type ParsedItem = {
  question: string;
  answer: string;
};

function parseCsvToItems(csv: string): ParsedItem[] {
  const rows = parseCSV(csv).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length === 0) throw new Error("No rows found");

  const [header, ...data] = rows;
  const h = header.map((s) => s.trim().toLowerCase());
  const idx = (name: string) => h.indexOf(name);

  const items = data.map((cols) => {
    const q = idx("question") >= 0 ? cols[idx("question")] : (idx("stem") >= 0 ? cols[idx("stem")] : "");
    const a = idx("answer") >= 0 ? cols[idx("answer")] : "";
    return { question: q ?? "", answer: a ?? "" } as ParsedItem;
  });

  const invalid = items.findIndex((i) => !i.question || !i.answer);
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
      return Response.json({ items });
    }

    if (!Array.isArray(indices) || indices.length === 0)
      return new Response("indices is required for commit", { status: 400 });

    const toCreate = indices
      .map((i) => items[i])
      .filter((x): x is ParsedItem => !!x);
    if (toCreate.length === 0) return new Response("No valid indices to import", { status: 400 });

    const created = await prisma.$transaction(
      toCreate.map((i) =>
        prisma.shortQuestion.create({
          data: {
            subchapterId,
            prompt: i.question,
            answer: i.answer,
            conceptType: normalizedConceptType,
          },
        })
      )
    );

    return Response.json({ count: created.length });
  } catch (e) {
    return new Response((e as Error).message || "Invalid CSV", { status: 400 });
  }
}
