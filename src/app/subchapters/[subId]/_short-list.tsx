"use client";
import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  prompt: string;
  answer: string;
  conceptType: string;
  createdAt: string;
};

const CONCEPT_TYPES = [
  { value: "CORE", label: "Core (Foundational)" },
  { value: "INTERMEDIATE", label: "Intermediate (Supporting)" },
  { value: "ADVANCED", label: "Advanced (Specialized)" },
  { value: "PERIPHERAL", label: "Peripheral (Supplementary)" },
  { value: "MISC", label: "Miscellaneous (Engagement)" },
] as const;

export default function ShortList({ subId }: { subId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conceptFilter, setConceptFilter] = useState<string>("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ subchapterId: subId });
      if (conceptFilter) qs.set("conceptTypes", conceptFilter);
      const r = await fetch(`/api/shorts?${qs.toString()}`);
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { items: Item[] };
      setItems(data.items || []);
    } catch (e) {
      setError((e as Error).message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subId, conceptFilter]);

  const summary = useMemo(() => {
    const total = items.length;
    const byConcept = items.reduce<Record<string, number>>((acc, it) => {
      acc[it.conceptType] = (acc[it.conceptType] || 0) + 1;
      return acc;
    }, {});
    return { total, byConcept };
  }, [items]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">Filter:</label>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={conceptFilter}
          onChange={(e) => setConceptFilter(e.target.value)}
        >
          <option value="">All concepts</option>
          {CONCEPT_TYPES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button className="rounded border px-3 py-1 text-sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
        {error ? <div className="text-sm text-red-700">{error}</div> : null}
      </div>

      <div className="text-sm text-zinc-600">Total: {summary.total}</div>

      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-600">{new Date(it.createdAt).toLocaleString()}</div>
              <div className="text-xs">{it.conceptType}</div>
            </div>
            <div className="mt-1 text-sm font-medium">{it.prompt}</div>
            <div className="mt-1 text-sm">
              <span className="rounded bg-zinc-100 px-1.5 text-xs mr-2">A</span>
              <span className="font-medium">{it.answer}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

