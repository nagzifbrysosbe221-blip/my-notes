"use client";
import { useEffect, useMemo, useState } from "react";

type Choice = {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
  explanation?: string | null;
};

type Question = {
  id: string;
  prompt: string;
  explanation?: string | null;
  choices: Choice[];
  // concepts?: string[] (optional if backend stores it)
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CONCEPT_TYPES = [
  { value: "CORE", label: "Core (Foundational)" },
  { value: "INTERMEDIATE", label: "Intermediate (Supporting)" },
  { value: "ADVANCED", label: "Advanced (Specialized)" },
  { value: "PERIPHERAL", label: "Peripheral (Supplementary)" },
  { value: "MISC", label: "Miscellaneous (Engagement)" },
] as const;

export default function MCQPractice({ subId }: { subId: string }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [shuffledChoices, setShuffledChoices] = useState<Choice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [selectedConcepts, setSelectedConcepts] = useState<Record<string, boolean>>({});
  const [practiceMode, setPracticeMode] = useState<"all" | "ignore_learned" | "mixed">("all");
  const [sessionSize, setSessionSize] = useState<10 | 20 | 30 | 0>(0); // 0 = no limit (All)
  const [initDone, setInitDone] = useState(false);
  const [summary, setSummary] = useState<{ total: number; learned: number; inProgress: number; new: number }>({ total: 0, learned: 0, inProgress: 0, new: 0 });
  const [elapsed, setElapsed] = useState(0); // seconds
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);
  const [sessionSkipped, setSessionSkipped] = useState(0);

  async function loadQuestions() {
    setLoading(true);
    try {
      const concepts = Object.entries(selectedConcepts)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(",");
      const qs = new URLSearchParams({ subchapterId: subId, practiceMode });
      if (concepts) qs.set("conceptTypes", concepts);
      const r = await fetch(`/api/mcqs?${qs.toString()}`);
      if (!r.ok) throw new Error(await r.text());
      const data: Question[] = await r.json();
      const order = shuffle(data);
      const limited = sessionSize && sessionSize > 0 ? order.slice(0, sessionSize) : order;
      setItems(limited);
      setIndex(0);
      setSelectedId(null);
      setShowCorrect(false);
      if (limited.length > 0) setShuffledChoices(shuffle(limited[0].choices));
      else setShuffledChoices([]);

      // Also load progress summary for current concept filters
      await refreshSummary(concepts, limited.length);
      setElapsed(0); // reset session timer
      setSessionCorrect(0);
      setSessionIncorrect(0);
      setSessionSkipped(0);
    } catch (e) {
      alert((e as Error).message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Load saved filters or default to all concepts selected
    try {
      const raw = localStorage.getItem(`mcqPractice:${subId}`);
      if (raw) {
        const saved = JSON.parse(raw) as { concepts?: Record<string, boolean>; practiceMode?: string; sessionSize?: number };
        if (saved.concepts) setSelectedConcepts(saved.concepts);
        else {
          const all: Record<string, boolean> = {};
          CONCEPT_TYPES.forEach((c) => (all[c.value] = true));
          setSelectedConcepts(all);
        }
        if (saved.practiceMode && ["all", "ignore_learned", "mixed"].includes(saved.practiceMode)) {
          setPracticeMode(saved.practiceMode as any);
        }
        if (typeof saved.sessionSize === "number" && [10, 20, 30, 0].includes(saved.sessionSize)) {
          setSessionSize(saved.sessionSize as any);
        }
      } else {
        const all: Record<string, boolean> = {};
        CONCEPT_TYPES.forEach((c) => (all[c.value] = true));
        setSelectedConcepts(all);
      }
    } catch {
      const all: Record<string, boolean> = {};
      CONCEPT_TYPES.forEach((c) => (all[c.value] = true));
      setSelectedConcepts(all);
    }
    setInitDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subId]);

  // Persist and auto-apply on filter changes
  useEffect(() => {
    if (!initDone) return;
    const payload = { concepts: selectedConcepts, practiceMode, sessionSize };
    try {
      localStorage.setItem(`mcqPractice:${subId}`, JSON.stringify(payload));
    } catch {}
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConcepts, practiceMode, sessionSize]);

  // Update choices when index changes
  useEffect(() => {
    if (items[index]) setShuffledChoices(shuffle(items[index].choices));
    else setShuffledChoices([]);
    setSelectedId(null);
    setShowCorrect(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Reset to first item when items change
  useEffect(() => {
    setIndex(0);
    if (items[0]) setShuffledChoices(shuffle(items[0].choices));
    else setShuffledChoices([]);
    setSelectedId(null);
    setShowCorrect(false);
  }, [items]);

  // Session timer (optional, compact display)
  useEffect(() => {
    if (items.length === 0) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [items]);

  const timeStr = useMemo(() => {
    const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const s = (elapsed % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [elapsed]);

  const startNewRound = () => {
    if (items.length === 0) return;
    const re = shuffle(items);
    setItems(re);
    setIndex(0);
    setSelectedId(null);
    setShowCorrect(false);
    if (re[0]) setShuffledChoices(shuffle(re[0].choices));
    else setShuffledChoices([]);
    setSessionCorrect(0);
    setSessionIncorrect(0);
    setSessionSkipped(0);
  };

  async function refreshSummary(conceptsCsv?: string, fallbackTotal?: number) {
    const qs2 = new URLSearchParams({ subchapterId: subId });
    if (conceptsCsv) qs2.set("conceptTypes", conceptsCsv);
    try {
      const r2 = await fetch(`/api/mcqs/with-progress?${qs2.toString()}`);
      if (r2.ok) {
        const d = (await r2.json()) as { summary: { total: number; learned: number; inProgress: number; new: number } };
        setSummary(d.summary);
      } else if (typeof fallbackTotal === "number") {
        setSummary({ total: fallbackTotal, learned: 0, inProgress: 0, new: fallbackTotal });
      }
    } catch {
      if (typeof fallbackTotal === "number") setSummary({ total: fallbackTotal, learned: 0, inProgress: 0, new: fallbackTotal });
    }
  }

  const current = items[index];
  const total = items.length;
  const displayIndex = total > 0 ? index + 1 : 0;
  const selected = useMemo(() => shuffledChoices.find((c) => c.id === selectedId), [shuffledChoices, selectedId]);
  const correct = useMemo(() => shuffledChoices.find((c) => c.isCorrect), [shuffledChoices]);
  const labelForIndex = (i: number) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i] ?? String(i + 1);
  const displayedCorrectLabel = useMemo(() => {
    if (!correct) return "";
    const idx = shuffledChoices.findIndex((c) => c.id === correct.id);
    return idx >= 0 ? labelForIndex(idx) : "";
  }, [correct, shuffledChoices]);

  // Keyboard shortcuts: A–F select by row order (auto-reveal), R reveal, N next/again
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["a","b","c","d","e","f"].includes(key)) {
        const idx = key.charCodeAt(0) - 97; // 'a' -> 0
        const choice = shuffledChoices[idx];
        if (choice) {
          e.preventDefault();
          setSelectedId(choice.id);
          // Auto-reveal and log when using keyboard selection
          (async () => {
            setShowCorrect(true);
            try {
              if (current) {
                await fetch("/api/mcqs/practice", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ questionId: current.id, correct: !!choice.isCorrect }),
                });
                if (choice.isCorrect) setSessionCorrect((c) => c + 1);
                else setSessionIncorrect((c) => c + 1);
                const concepts = Object.entries(selectedConcepts)
                  .filter(([, v]) => v)
                  .map(([k]) => k)
                  .join(",");
                refreshSummary(concepts, items.length);
              }
            } catch {}
          })();
        }
      } else if (key === "r") {
        e.preventDefault();
        if (!showCorrect) {
          (async () => {
            setShowCorrect(true);
            try {
              if (current && selectedId) {
                const sel = shuffledChoices.find((c) => c.id === selectedId);
                await fetch("/api/mcqs/practice", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ questionId: current.id, correct: !!sel?.isCorrect }),
                });
                if (sel) {
                  if (sel.isCorrect) setSessionCorrect((c) => c + 1);
                  else setSessionIncorrect((c) => c + 1);
                }
                const concepts = Object.entries(selectedConcepts)
                  .filter(([, v]) => v)
                  .map(([k]) => k)
                  .join(",");
                refreshSummary(concepts, items.length);
              }
            } catch {}
          })();
        }
      } else if (key === "n") {
        e.preventDefault();
        if (!showCorrect) setSessionSkipped((s) => s + 1);
        if (index + 1 >= total) startNewRound();
        else setIndex((i) => (i + 1 < total ? i + 1 : i));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffledChoices, selectedId, showCorrect, current, total, index]);

  if (loading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (!current) return <div className="text-sm text-zinc-500">No questions yet.</div>;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="flex flex-wrap items-center gap-3 p-3">
          <div className="text-sm font-medium">Concepts:</div>
          {CONCEPT_TYPES.map((c) => {
            const active = !!selectedConcepts[c.value];
            return (
              <button
                key={c.value}
                type="button"
                className={`rounded-full px-3 py-1 text-xs border ${active ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-700"}`}
                onClick={() => setSelectedConcepts((s) => ({ ...s, [c.value]: !active }))}
              >
                {c.label}
              </button>
            );
          })}
          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={() => {
              const all: Record<string, boolean> = {};
              CONCEPT_TYPES.forEach((c) => (all[c.value] = true));
              setSelectedConcepts(all);
            }}
          >
            Select all
          </button>
          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={() => {
              const none: Record<string, boolean> = {};
              CONCEPT_TYPES.forEach((c) => (none[c.value] = false));
              setSelectedConcepts(none);
            }}
          >
            None
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div className="text-xs text-zinc-600">
              {items.length} cards match filters 
              <span className="ml-2 inline-flex items-center gap-1">
                <span className="rounded bg-zinc-100 px-1 text-[10px]">New {summary.new}</span>
                <span className="rounded bg-zinc-100 px-1 text-[10px]">In prog {summary.inProgress}</span>
                <span className="rounded bg-zinc-100 px-1 text-[10px]">Learned {summary.learned}</span>
              </span>
            </div>
            <div className="text-xs text-zinc-500">{timeStr}</div>
            <div className="inline-flex overflow-hidden rounded-md border text-sm">
              <button
                type="button"
                className={`px-3 py-1 ${practiceMode === "all" ? "bg-zinc-900 text-white" : "bg-white"}`}
                onClick={() => setPracticeMode("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`px-3 py-1 border-l ${practiceMode === "ignore_learned" ? "bg-zinc-900 text-white" : "bg-white"}`}
                onClick={() => setPracticeMode("ignore_learned")}
              >
                Ignore learned
              </button>
              <button
                type="button"
                className={`px-3 py-1 border-l ${practiceMode === "mixed" ? "bg-zinc-900 text-white" : "bg-white"}`}
                onClick={() => setPracticeMode("mixed")}
              >
                Mixed
              </button>
            </div>
            <label className="text-sm">Session size:</label>
            <select
              className="rounded border px-2 py-1 text-sm"
              value={sessionSize}
              onChange={(e) => setSessionSize(Number(e.target.value) as any)}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={0}>All</option>
            </select>
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              title="Shortcuts: A–F select • R reveal • N next"
              aria-label="Shortcuts hint"
            >
              ?
            </button>
          </div>
        </div>
        {/* Progress bar locked with filters */}
        <div className="h-1 w-full bg-zinc-100">
          <div
            className="h-1 bg-zinc-900 transition-all"
            style={{ width: `${total > 0 ? (displayIndex / total) * 100 : 0}%` }}
          />
        </div>
      </div>
      
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500">
          Question {displayIndex} / {total} · Left {Math.max(total - displayIndex, 0)} · Correct {sessionCorrect} · Incorrect {sessionIncorrect} · Skipped {sessionSkipped}
            </div>
            <div className="flex gap-2">
              <button
                className="rounded border px-2 py-1 text-sm disabled:opacity-60"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Prev
              </button>
              <button
                className="rounded border px-2 py-1 text-sm disabled:opacity-60"
                onClick={() => {
                  if (!showCorrect) setSessionSkipped((s) => s + 1);
                  if (index >= total - 1) startNewRound();
                  else setIndex((i) => Math.min(total - 1, i + 1));
                }}
              >
                {index >= total - 1 ? "Try again" : "Next"}
              </button>
            </div>
          </div>

      {total === 0 ? (
        <div className="rounded border p-4 text-sm text-zinc-600">
          No questions match the current filters. Adjust filters or import cards.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="text-base font-medium">{current.prompt}</div>
            <ul className="space-y-2">
              {shuffledChoices.map((c, idx) => {
                const isSelected = selectedId === c.id;
                const showState = showCorrect;
                const stateClass = showCorrect
                  ? c.isCorrect
                    ? "border-green-600 bg-green-50"
                    : "border-red-600 bg-red-50"
                  : isSelected
                    ? "border-zinc-900 bg-zinc-50"
                    : "";
                const displayedLabel = labelForIndex(idx);
                return (
                  <li key={c.id}>
                    <button
                      className={`w-full rounded border p-3 text-left text-base ${stateClass}`}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <span className="mr-2 inline-block rounded bg-zinc-100 px-1.5 text-xs">{displayedLabel}</span>
                      {c.text}
                      {showState ? (
                        <span className={`ml-2 text-xs ${c.isCorrect ? "text-green-700" : "text-red-700"}`}>
                          {c.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                        </span>
                      ) : null}
                    </button>
                    {showCorrect && c.explanation ? (
                      <div className="mt-1 rounded bg-zinc-50 p-2 text-xs text-zinc-700">{c.explanation}</div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded border px-3 py-1 text-sm disabled:opacity-60"
              disabled={!selectedId}
              onClick={async () => {
                setShowCorrect(true);
                try {
                  if (current && selected) {
                    await fetch("/api/mcqs/practice", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ questionId: current.id, correct: !!selected?.isCorrect }),
                    });
                    const concepts = Object.entries(selectedConcepts)
                      .filter(([, v]) => v)
                      .map(([k]) => k)
                      .join(",");
                    refreshSummary(concepts, items.length);
                    if (selected.isCorrect) setSessionCorrect((c) => c + 1);
                    else setSessionIncorrect((c) => c + 1);
                  }
                } catch {}
              }}
            >
              Reveal
            </button>
            <button
              className="rounded border px-3 py-1 text-sm disabled:opacity-60"
              onClick={() => {
                if (!showCorrect) setSessionSkipped((s) => s + 1);
                if (index >= total - 1) startNewRound();
                else setIndex((i) => Math.min(total - 1, i + 1));
              }}
            >
              {index >= total - 1 ? "Try again" : "Next"}
            </button>
          </div>

          {showCorrect && correct ? (
              <div className="space-y-2 rounded border p-3">
                <div className="text-sm">
                  Correct: <span className="font-medium">{displayedCorrectLabel}</span> — {correct.text}
                </div>
                {current.explanation ? (
                  <div className="text-xs text-zinc-700">{current.explanation}</div>
                ) : null}
                <div className="flex gap-2 pt-1">
                  <button
                    className="rounded border px-2 py-1 text-sm"
                    onClick={async () => {
                      try {
                        await fetch(`/api/mcqs/${current.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "LEARNED" }),
                        });
                        setSessionCorrect((c) => c + 1);
                      } catch {}
                    }}
                  >
                    Mark Learned
                  </button>
                  <button
                    className="rounded border px-2 py-1 text-sm"
                    onClick={async () => {
                      try {
                        await fetch("/api/mcqs/practice", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ questionId: current.id, correct: false }),
                        });
                      } catch {}
                      setSessionIncorrect((c) => c + 1);
                      if (index >= total - 1) startNewRound();
                      else setIndex((i) => Math.min(total - 1, i + 1));
                    }}
                  >
                    Again
                  </button>
                </div>
              </div>
          ) : null}
        </>
      )}
    </div>
  );
}
