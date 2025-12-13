"use client";
import { useMemo, useState } from "react";

type PreviewItem = {
  question: string;
  answer: string;
};

const CONCEPT_TYPES = [
  { value: "CORE", label: "Core (Foundational)" },
  { value: "INTERMEDIATE", label: "Intermediate (Supporting)" },
  { value: "ADVANCED", label: "Advanced (Specialized)" },
  { value: "PERIPHERAL", label: "Peripheral (Supplementary)" },
  { value: "MISC", label: "Miscellaneous (Engagement)" },
] as const;
type ConceptValue = (typeof CONCEPT_TYPES)[number]["value"];

export default function CreativeImport({ subId }: { subId: string }) {
  const defaultHeader = "question|answer@";
  const [csv, setCsv] = useState(defaultHeader);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<string | null>(null);
  const [conceptType, setConceptType] = useState<ConceptValue | "">("CORE");

  const sample = `question|answer@Propose one way to improve team retrospectives.|Introduce a rotating facilitator to balance voices`;

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
      const r = await fetch("/api/creatives/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subchapterId: subId, csv, mode: "preview", conceptType }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { items: PreviewItem[] };
      setPreview(data.items || []);
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
      const r = await fetch("/api/creatives/import", {
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
        <p className="text-zinc-600">Columns separated by <code>|</code>, rows separated by <code>@</code>. Headers: question | answer</p>
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
          onChange={(e) => setConceptType(e.target.value as ConceptValue | "")}
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
                    <span className="font-medium">{item.question}</span>
                  </label>
                  <span className="text-xs text-zinc-600">Answer</span>
                </div>
                <div className="text-sm">
                  <span className="rounded bg-zinc-100 px-1.5 text-xs mr-2">A</span>
                  <span className="font-medium">{item.answer}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
