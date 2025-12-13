"use client";
import { useEffect, useMemo, useState } from "react";

type Choice = {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
  explanation?: string | null;
};

type Item = {
  id: string;
  prompt: string;
  explanation?: string | null;
  conceptType: string;
  choices: Choice[];
  stats: {
    seenCount: number;
    correctCount: number;
    isLearned: boolean;
    lastReviewedAt: string | null;
    status: "LEARNED" | "NEW" | "IN_PROGRESS";
  };
};
type Status = Item["stats"]["status"];

const CONCEPT_TYPES = [
  { value: "CORE", label: "Core (Foundational)" },
  { value: "INTERMEDIATE", label: "Intermediate (Supporting)" },
  { value: "ADVANCED", label: "Advanced (Specialized)" },
  { value: "PERIPHERAL", label: "Peripheral (Supplementary)" },
  { value: "MISC", label: "Miscellaneous (Engagement)" },
] as const;

export default function MCQCards({ subId }: { subId: string }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conceptFilters, setConceptFilters] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"list" | "study">("list");
  const [studyIndex, setStudyIndex] = useState(0);

  const summary = useMemo(() => {
    return items.reduce(
      (acc, it) => {
        acc.total += 1;
        if (it.stats.status === "LEARNED") acc.learned += 1;
        else if (it.stats.status === "IN_PROGRESS") acc.inProgress += 1;
        else acc.new += 1;
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
      const r = await fetch(`/api/mcqs/with-progress?${qs}`);
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { items: Item[] };
      setItems(data.items);
      setStudyIndex(0);
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

  const changeStatus = async (id: string, status: Status) => {
    try {
      const r = await fetch(`/api/mcqs/${id}`, {
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

  const del = async (id: string) => {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    try {
      const r = await fetch(`/api/mcqs/${id}`, { method: "DELETE" });
      if (!r.ok && r.status !== 204) throw new Error(await r.text());
      await load();
    } catch (e) {
      alert((e as Error).message || "Failed to delete");
    }
  };

  const handleNext = () => {
    if (items.length === 0) return;
    setStudyIndex((idx) => (idx + 1) % items.length);
  };

  const handlePrev = () => {
    if (items.length === 0) return;
    setStudyIndex((idx) => (idx - 1 + items.length) % items.length);
  };

  const currentCard = items[studyIndex];
  const correctChoice = currentCard?.choices.find((c) => c.isCorrect);

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
        <div className="flex items-center gap-2">
          <span>Mode:</span>
          <button
            className={`rounded border px-2 py-1 ${viewMode === "list" ? "border-zinc-900 text-zinc-900" : "text-zinc-500"}`}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
          <button
            className={`rounded border px-2 py-1 ${viewMode === "study" ? "border-zinc-900 text-zinc-900" : "text-zinc-500"}`}
            onClick={() => setViewMode("study")}
          >
            Study
          </button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
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
        <div className="text-sm text-zinc-500">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-zinc-500">No cards yet.</div>
      ) : viewMode === "study" && currentCard ? (
        <div className="space-y-4 rounded-2xl border border-zinc-200 p-5 shadow-sm dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
            <span>
              Card {studyIndex + 1} of {items.length}
            </span>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold dark:bg-indigo-500/10">
                {currentCard.conceptType}
              </span>
              <span>{currentCard.stats.status.replace("_", " ")}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Stem</p>
            <p className="mt-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">{currentCard.prompt}</p>
          </div>
          <div className="space-y-3">
            {currentCard.choices.map((choice) => (
              <div
                key={choice.id}
                className={`rounded-2xl border p-3 text-sm ${
                  choice.isCorrect ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{choice.label}.</span>
                  <p className="text-zinc-700 dark:text-zinc-200">{choice.text}</p>
                </div>
                {choice.explanation ? (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Explanation: {choice.explanation}</p>
                ) : null}
                {choice.isCorrect ? (
                  <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                    Correct answer
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          {correctChoice ? (
            <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
              <p className="font-semibold">Correct answer</p>
              <p className="mt-1">
                {correctChoice.label}. {correctChoice.text}
              </p>
            </div>
          ) : null}
          {currentCard.explanation ? (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="font-semibold">Why</p>
              <p className="mt-1">{currentCard.explanation}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Seen {currentCard.stats.seenCount}</span>
            <span>Correct {currentCard.stats.correctCount}</span>
            {currentCard.stats.lastReviewedAt ? <span>Last reviewed {new Date(currentCard.stats.lastReviewedAt).toLocaleDateString()}</span> : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <button className="rounded border px-3 py-1.5 text-sm disabled:opacity-50" onClick={handlePrev} disabled={items.length <= 1}>
              Previous
            </button>
            <button className="rounded border px-3 py-1.5 text-sm disabled:opacity-50" onClick={handleNext} disabled={items.length <= 1}>
              Next
            </button>
          </div>
        </div>
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
              <div className="flex gap-2">
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
