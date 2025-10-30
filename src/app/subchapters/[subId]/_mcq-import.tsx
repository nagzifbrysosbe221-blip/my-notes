"use client";
import { useMemo, useState } from "react";

type PreviewChoice = { label: string; text: string; explanation?: string | null; isCorrect: boolean };
type PreviewItem = {
  stem: string;
  choices: PreviewChoice[];
  correctIndex: number;
  concepts: string[];
  explanation?: string | null;
};

const CONCEPT_TYPES = [
  { value: "CORE", label: "Core (Foundational)" },
  { value: "INTERMEDIATE", label: "Intermediate (Supporting)" },
  { value: "ADVANCED", label: "Advanced (Specialized)" },
  { value: "PERIPHERAL", label: "Peripheral (Supplementary)" },
  { value: "MISC", label: "Miscellaneous (Engagement)" },
] as const;

export default function MCQImport({ subId }: { subId: string }) {
  const defaultHeader = "stem|choiceA|expA|choiceB|expB|choiceC|expC|choiceD|expD|correct|explanation@";
  const [csv, setCsv] = useState(defaultHeader);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<string | null>(null);
  const [conceptType, setConceptType] = useState<typeof CONCEPT_TYPES[number]["value"] | "">("CORE");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const sample = `stem|choiceA|expA|choiceB|expB|choiceC|expC|choiceD|expD|correct|explanation@What is 2+2?|3||4|Two plus two is four|5||22||B|Basic arithmetic.`;

  const allSelected = useMemo(() => {
    if (!preview || preview.length === 0) return false;
    return preview.every((_, i) => selected[i]);
  }, [preview, selected]);

  const toggleAll = () => {
    if (!preview) return;
    const next: Record<number, boolean> = {};
    const val = !allSelected;
    preview.forEach((_, i) => (next[i] = val));
    setSelected(next);
  };

  const onPreview = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    setPreview(null);
    setSelected({});
    try {
      const r = await fetch("/api/mcqs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subchapterId: subId, csv, mode: "preview", conceptType }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { items: PreviewItem[] };
      setPreview(data.items || []);
      // default select all
      const sel: Record<number, boolean> = {};
      data.items.forEach((_, i) => (sel[i] = true));
      setSelected(sel);
    } catch (e) {
      setError((e as Error).message || "Preview failed");
    } finally {
      setBusy(false);
    }
  };

  const onImport = async () => {
    if (!preview) return;
    const indices = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => Number(k))
      .sort((a, b) => a - b);
    if (indices.length === 0) {
      setResult("No items selected");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/mcqs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subchapterId: subId, csv, mode: "commit", indices, conceptType }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setResult(`Imported ${data.count} question(s)`);
    } catch (e) {
      setError((e as Error).message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded border p-3 text-sm">
        <div className="font-medium">CSV format</div>
        <p className="text-zinc-600">Columns separated by <code>|</code>, rows separated by <code>@</code>.</p>
        <p className="text-zinc-600">Headers: stem | choiceA | expA | choiceB | expB | choiceC | expC | choiceD | expD | correct | explanation</p>
        <p className="text-zinc-600">- correct accepts A/B/C labels, index, or exact text.</p>
        <p className="text-zinc-600">- Concept category is selected from the dropdown and applied to all imported cards.</p>
        <div className="mt-2 rounded bg-zinc-50 p-2 text-xs">
          <pre className="whitespace-pre-wrap">{sample}</pre>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">Concept:</label>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={conceptType}
          onChange={(e) => setConceptType(e.target.value as any)}
        >
          <option value="" disabled>
            Select concept category
          </option>
          {CONCEPT_TYPES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm">View:</label>
          <select
            className="rounded border px-2 py-1 text-sm"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
          >
            <option value="cards">Cards</option>
            <option value="table">Table</option>
          </select>
        </div>
        <button className="rounded border px-3 py-1 text-sm disabled:opacity-60" disabled={busy || !csv.trim() || !conceptType} onClick={onPreview}>
          {busy ? "Working..." : "Preview"}
        </button>
        {preview && preview.length > 0 ? (
          <button className="rounded border px-3 py-1 text-sm disabled:opacity-60" disabled={busy} onClick={onImport}>
            {busy ? "Importing..." : "Import Selected"}
          </button>
        ) : null}
        <div className="text-sm text-green-700">{result}</div>
        <div className="text-sm text-red-700">{error}</div>
      </div>

      <textarea
        className="h-40 w-full rounded border p-2 text-sm font-mono"
        placeholder="Paste CSV here"
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
      />

      {preview && preview.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-600">Previewing {preview.length} item(s)</div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-600">Concept:</label>
              <span className="text-xs">{CONCEPT_TYPES.find((c) => c.value === conceptType)?.label || conceptType}</span>
              <button className="rounded border px-2 py-1 text-xs" onClick={toggleAll}>{allSelected ? "Deselect all" : "Select all"}</button>
            </div>
          </div>
          {viewMode === "cards" ? (
            <ul className="space-y-3">
              {preview.map((item, i) => (
                <li key={i} className="rounded border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={!!selected[i]}
                        onChange={(e) => setSelected((s) => ({ ...s, [i]: e.target.checked }))}
                      />
                      <span className="font-medium">{item.stem}</span>
                    </label>
                    <span className="text-xs text-zinc-600">Concept: {CONCEPT_TYPES.find(c => c.value === conceptType)?.label || conceptType}</span>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {item.choices.map((c, idx) => (
                      <li key={idx} className="rounded border p-2">
                        <div>
                          <span className="mr-2 inline-block rounded bg-zinc-100 px-1.5 text-xs">{c.label}</span>
                          <span className={c.isCorrect ? "font-medium" : ""}>{c.text}</span>
                          {c.isCorrect ? <span className="ml-2 text-xs text-green-700">(correct)</span> : null}
                        </div>
                        {c.explanation ? (
                          <div className="mt-1 text-xs text-zinc-700">{c.explanation}</div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {item.explanation ? (
                    <div className="mt-2 rounded bg-zinc-50 p-2 text-xs text-zinc-700">Overall: {item.explanation}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-auto rounded border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs text-zinc-600">
                  <tr>
                    <th className="px-2 py-2">Select</th>
                    <th className="px-2 py-2">Stem</th>
                    <th className="px-2 py-2">A</th>
                    <th className="px-2 py-2">B</th>
                    <th className="px-2 py-2">C</th>
                    <th className="px-2 py-2">D</th>
                    <th className="px-2 py-2">E</th>
                    <th className="px-2 py-2">F</th>
                    <th className="px-2 py-2">Correct</th>
                    <th className="px-2 py-2">Concept</th>
                    <th className="px-2 py-2">Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((item, i) => {
                    const getCell = (label: string) => {
                      const c = item.choices.find((x) => x.label === label);
                      if (!c) return "";
                      return `${c.text}${c.explanation ? ` - ${c.explanation}` : ""}`;
                    };
                    const correct = item.choices.find((x) => x.isCorrect)?.label || "";
                    return (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-2 align-top">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!selected[i]}
                            onChange={(e) => setSelected((s) => ({ ...s, [i]: e.target.checked }))}
                          />
                        </td>
                        <td className="px-2 py-2 align-top font-medium">{item.stem}</td>
                        <td className="px-2 py-2 align-top">{getCell("A")}</td>
                        <td className="px-2 py-2 align-top">{getCell("B")}</td>
                        <td className="px-2 py-2 align-top">{getCell("C")}</td>
                        <td className="px-2 py-2 align-top">{getCell("D")}</td>
                        <td className="px-2 py-2 align-top">{getCell("E")}</td>
                        <td className="px-2 py-2 align-top">{getCell("F")}</td>
                        <td className="px-2 py-2 align-top">{correct}</td>
                        <td className="px-2 py-2 align-top">{CONCEPT_TYPES.find(c => c.value === conceptType)?.label || conceptType}</td>
                        <td className="px-2 py-2 align-top">{item.explanation || ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <button
            className="rounded border px-3 py-1 text-sm disabled:opacity-60"
            disabled={busy}
            onClick={onImport}
          >
            {busy ? "Importing..." : `Import ${Object.values(selected).filter(Boolean).length} selected`}
          </button>
        </div>
      ) : null}

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {result ? <div className="text-sm text-zinc-700">{result}</div> : null}
    </div>
  );
}
