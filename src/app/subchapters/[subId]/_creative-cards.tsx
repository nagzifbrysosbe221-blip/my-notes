"use client";
import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  prompt: string;
  answer: string;
  conceptType: string;
  stats: { seenCount: number; correctCount: number; isLearned: boolean; lastReviewedAt: string | null; status: "LEARNED" | "NEW" | "IN_PROGRESS" };
};
type Status = Item["stats"]["status"];

const CONCEPT_TYPES = [
  { value: "CORE", label: "Core (Foundational)" },
  { value: "INTERMEDIATE", label: "Intermediate (Supporting)" },
  { value: "ADVANCED", label: "Advanced (Specialized)" },
  { value: "PERIPHERAL", label: "Peripheral (Supplementary)" },
  { value: "MISC", label: "Miscellaneous (Engagement)" },
] as const;

export default function CreativeCards({ subId }: { subId: string }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conceptFilters, setConceptFilters] = useState<Record<string, boolean>>({});

  const summary = useMemo(() => {
    return items.reduce(
      (acc, it) => {
        acc.total++;
        if (it.stats.status === "LEARNED") acc.learned++;
        else if (it.stats.status === "IN_PROGRESS") acc.inProgress++;
        else acc.new++;
        return acc;
      },
      { total: 0, learned: 0, inProgress: 0, new: 0 }
    );
  }, [items]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const concepts = Object.entries(conceptFilters)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(",");
      const qs = new URLSearchParams({ subchapterId: subId });
      if (concepts) qs.set("conceptTypes", concepts);
      const r = await fetch(`/api/creatives/with-progress?${qs}`);
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { items: Item[] };
      setItems(data.items);
    } catch (e) {
      setError((e as Error).message || "Failed to load cards");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subId]);

  const del = async (id: string) => {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    try {
      const r = await fetch(`/api/creatives/${id}`, { method: "DELETE" });
      if (!r.ok && r.status !== 204) throw new Error(await r.text());
      await load();
    } catch (e) {
      alert((e as Error).message || "Failed to delete");
    }
  };

  const changeStatus = async (id: string, status: Status) => {
    try {
      const r = await fetch(`/api/creatives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e) {
      alert((e as Error).message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded border p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Stats:</span>
          <span>Total {summary.total}</span>
          <span>New {summary.new}</span>
          <span>In progress {summary.inProgress}</span>
          <span>Learned {summary.learned}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label>Concepts:</label>
          {CONCEPT_TYPES.map((c) => (
            <label key={c.value} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={!!conceptFilters[c.value]}
                onChange={(e) => setConceptFilters((s) => ({ ...s, [c.value]: e.target.checked }))}
              />
              {c.label}
            </label>
          ))}
          <button className="rounded border px-2 py-1" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-zinc-500">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-zinc-500">No cards yet.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="rounded border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs">{it.conceptType}</span>
                  <span className="font-medium">{it.prompt}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <span>Seen {it.stats.seenCount}</span>
                  <span>Correct {it.stats.correctCount}</span>
                  <span>
                    Status: <span className="font-medium">{it.stats.status.replace("_", " ")}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded bg-zinc-100 px-1.5 text-xs">A</span>
                <span className="font-medium">{it.answer}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <select
                  className="rounded border px-2 py-1 text-sm"
                  value={it.stats.status}
                  onChange={(e) => changeStatus(it.id, e.target.value as Status)}
                >
                  <option value="NEW">New</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="LEARNED">Learned</option>
                </select>
                <button className="rounded border px-2 py-1 text-sm" onClick={() => del(it.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
