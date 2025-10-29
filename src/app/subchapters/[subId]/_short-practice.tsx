"use client";
import { useEffect, useMemo, useState } from "react";

type Item = { id: string; prompt: string; answer: string; conceptType: string };
type Summary = { total: number; learned: number; inProgress: number; new: number };

const CONCEPT_TYPES = [
  { value: "CORE", label: "Core (Foundational)" },
  { value: "INTERMEDIATE", label: "Intermediate (Supporting)" },
  { value: "ADVANCED", label: "Advanced (Specialized)" },
  { value: "PERIPHERAL", label: "Peripheral (Supplementary)" },
  { value: "MISC", label: "Miscellaneous (Engagement)" },
] as const;

export default function ShortPractice({ subId }: { subId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conceptFilters, setConceptFilters] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState<Summary>({ total: 0, learned: 0, inProgress: 0, new: 0 });

  const [queue, setQueue] = useState<string[]>([]); // item IDs order
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shuffle, setShuffle] = useState(true);

  const current = useMemo(() => {
    const id = queue[index];
    return items.find((x) => x.id === id) || null;
  }, [queue, index, items]);

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
      const r = await fetch(`/api/shorts/with-progress?${qs}`);
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { summary: Summary; items: (Item & { stats: any })[] };
      setSummary(data.summary || { total: 0, learned: 0, inProgress: 0, new: 0 });
      const base = data.items.map(({ id, prompt, answer, conceptType }) => ({ id, prompt, answer, conceptType }));
      setItems(base);
      const ids = base.map((x) => x.id);
      setQueue(shuffle ? shuffleArray(ids) : ids);
      setIndex(0);
      setRevealed(false);
    } catch (e) {
      setError((e as Error).message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subId]);

  const next = (again = false) => {
    setRevealed(false);
    setIndex((i) => {
      const curId = queue[i];
      if (again) {
        // Push current to the end once
        setQueue((q) => [...q.slice(0, i), ...q.slice(i + 1), curId]);
        return i; // stay on same index (now a new card moved into place)
      }
      const ni = i + 1;
      if (ni >= queue.length) return 0;
      return ni;
    });
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === "r" || key === " ") {
        if (!revealed) {
          e.preventDefault();
          setRevealed(true);
        }
      } else if (key === "a") {
        if (revealed) {
          e.preventDefault();
          record(false);
          next(true);
        }
      } else if (key === "n" || key === "enter") {
        if (revealed) {
          e.preventDefault();
          record(true);
          next(false);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, next]);

  function shuffleArray<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  

  async function record(correct: boolean) {
    const cur = current;
    if (!cur) return;
    try {
      await fetch("/api/shorts/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: cur.id, correct }),
      });
      // refresh summary counters without resetting the queue
      const concepts = Object.entries(conceptFilters)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(",");
      const qs = new URLSearchParams({ subchapterId: subId });
      if (concepts) qs.set("conceptTypes", concepts);
      const r2 = await fetch(`/api/shorts/with-progress?${qs}`);
      if (r2.ok) {
        const data2 = (await r2.json()) as { summary: Summary };
        setSummary(data2.summary || { total: 0, learned: 0, inProgress: 0, new: 0 });
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded border p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Stats:</span>
          <span>Total {summary.total}</span>
          <span>New {summary.new}</span>
          <span>In progress {summary.inProgress}</span>
          <span>Learned {summary.learned}</span>
        </div>
        <div className="h-5 w-px bg-zinc-200" />
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
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
            Shuffle
          </label>
          <button className="rounded border px-2 py-1" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-zinc-500">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-zinc-500">No questions.</div>
      ) : !current ? (
        <div className="text-sm text-zinc-500">No current question.</div>
      ) : (
        <div className="space-y-3">
          <div className="rounded border p-4">
            <div className="mb-2 text-xs text-zinc-600">{current.conceptType}</div>
            <div className="text-lg font-medium">{current.prompt}</div>
            {revealed ? (
              <div className="mt-3 rounded bg-zinc-50 p-3 text-sm">
                <div className="mb-1 text-xs text-zinc-600">Answer</div>
                <div className="font-medium">{current.answer}</div>
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            {!revealed ? (
              <button
                className="rounded border px-3 py-1 text-sm"
                title="Shortcut: R or Space"
                onClick={() => setRevealed(true)}
              >
                Reveal
              </button>
            ) : (
              <>
                <button
                  className="rounded border px-3 py-1 text-sm"
                  title="Shortcut: A"
                  onClick={() => { record(false); next(true); }}
                >
                  Again
                </button>
                <button
                  className="rounded border px-3 py-1 text-sm"
                  title="Shortcut: N or Enter"
                  onClick={() => { record(true); next(false); }}
                >
                  I got it
                </button>
              </>
            )}
          </div>
          <div className="text-xs text-zinc-500">Shortcuts: R/Space reveal • A again • N/Enter got it</div>
          <div className="text-xs text-zinc-600">
            {index + 1} / {queue.length}
          </div>
        </div>
      )}
    </div>
  );
}
