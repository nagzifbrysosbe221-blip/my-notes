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
  const [timerInput, setTimerInput] = useState("5");
  const [countdownTotal, setCountdownTotal] = useState(0);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [countdownRunning, setCountdownRunning] = useState(false);

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

  useEffect(() => {
    if (!countdownRunning) return;
    const id = setInterval(() => {
      setCountdownRemaining((prev) => {
        if (prev <= 1) {
          setCountdownRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdownRunning]);

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
  const countdownDisplay = useMemo(() => {
    if (countdownRemaining > 0) {
      const m = Math.floor(countdownRemaining / 60).toString().padStart(2, "0");
      const s = (countdownRemaining % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    }
    if (countdownTotal > 0) return "00:00";
    return "--:--";
  }, [countdownRemaining, countdownTotal]);

  const remainingQuestions = Math.max(total - displayIndex, 0);
  const progressRemaining = total > 0 ? (remainingQuestions / total) * 100 : 0;
  const progressCorrect = total > 0 ? (sessionCorrect / total) * 100 : 0;
  const progressIncorrect = total > 0 ? (sessionIncorrect / total) * 100 : 0;
  const countdownPct = countdownTotal > 0 ? (countdownRemaining / countdownTotal) * 100 : 0;

  const ringStyle = (pct: number, color: string) => ({
    background: `conic-gradient(${color} ${pct}%, #e2e8f0 ${pct}% 100%)`,
    transition: "background 0.6s ease",
  });

  const startCountdown = () => {
    const mins = Number.parseFloat(timerInput);
    if (!mins || mins <= 0) return;
    const seconds = Math.round(mins * 60);
    setCountdownTotal(seconds);
    setCountdownRemaining(seconds);
    setCountdownRunning(true);
  };
  const pauseCountdown = () => setCountdownRunning(false);
  const resetCountdown = () => {
    setCountdownRunning(false);
    setCountdownRemaining(0);
    setCountdownTotal(0);
  };

  const StatRing = ({
    label,
    value,
    pct,
    color,
  }: {
    label: string;
    value: string | number;
    pct: number;
    color: string;
  }) => (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-center dark:border-zinc-700 dark:bg-zinc-900/60">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="mx-auto mt-3 h-24 w-24 rounded-full bg-slate-100 p-2" style={ringStyle(pct, color)}>
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-900 dark:bg-zinc-900 dark:text-zinc-50">
          {value}
        </div>
      </div>
    </div>
  );

  // Keyboard shortcuts: A""F select by row order (auto-reveal), R reveal, N next/again
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

  if (loading) return <div className="text-sm text-slate-500">Loading...</div>;
  if (!current) return <div className="text-sm text-slate-500">No questions yet.</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Concept filters</p>
            <p className="text-sm text-slate-600 dark:text-zinc-300">
              Toggle which concepts to drill. Use shortcuts A-F to answer, R to reveal, N for next.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
            <span>{items.length} cards ready</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold dark:bg-zinc-800">
              Keys: A-F pick · R reveal · N next
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {CONCEPT_TYPES.map((c) => {
            const active = !!selectedConcepts[c.value];
            return (
              <button
                key={c.value}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "border-indigo-600 bg-indigo-600/90 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 dark:border-zinc-700 dark:bg-transparent"
                }`}
                onClick={() => setSelectedConcepts((s) => ({ ...s, [c.value]: !active }))}
              >
                {c.label}
              </button>
            );
          })}
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-indigo-200 dark:border-zinc-700 dark:text-zinc-300"
            onClick={() => {
              const all: Record<string, boolean> = {};
              CONCEPT_TYPES.forEach((c) => (all[c.value] = true));
              setSelectedConcepts(all);
            }}
          >
            Select all
          </button>
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-indigo-200 dark:border-zinc-700 dark:text-zinc-300"
            onClick={() => {
              const none: Record<string, boolean> = {};
              CONCEPT_TYPES.forEach((c) => (none[c.value] = false));
              setSelectedConcepts(none);
            }}
          >
            Clear
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-3 text-sm shadow-inner dark:bg-zinc-800/60">
            <p className="text-slate-500 dark:text-zinc-400">New</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">{summary.new}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-sm shadow-inner dark:bg-zinc-800/60">
            <p className="text-slate-500 dark:text-zinc-400">In progress</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">{summary.inProgress}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-sm shadow-inner dark:bg-zinc-800/60">
            <p className="text-slate-500 dark:text-zinc-400">Learned</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">{summary.learned}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1 py-1 text-xs font-semibold text-slate-600 dark:border-zinc-700 dark:bg-zinc-900">
            {(["all", "ignore_learned", "mixed"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-full px-3 py-1 ${
                  practiceMode === mode ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900" : ""
                }`}
                onClick={() => setPracticeMode(mode)}
              >
                {mode === "all" ? "All" : mode === "ignore_learned" ? "Ignore learned" : "Mixed"}
              </button>
            ))}
          </div>
          <label className="text-sm text-slate-500 dark:text-zinc-400">
            Session size
            <select
              className="ml-2 rounded-2xl border border-slate-200 px-3 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={sessionSize}
              onChange={(e) => setSessionSize(Number(e.target.value) as any)}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={0}>All</option>
            </select>
          </label>
        </div>
        <div className="mt-4 h-1 w-full rounded-full bg-slate-100 dark:bg-zinc-800">
          <div
            className="h-1 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
            style={{ width: `${total > 0 ? (displayIndex / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
          No questions match the current filters. Adjust filters or import cards.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_260px]">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="sticky top-36 z-10 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90 sm:top-32 lg:top-24">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Question {displayIndex} of {total}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-zinc-50">{current.prompt}</h3>
                </div>
                <div className="text-right text-xs text-slate-500 dark:text-zinc-400">
                  <p>Remaining {remainingQuestions}</p>
                  <p>Correct {sessionCorrect} | Incorrect {sessionIncorrect}</p>
                </div>
              </div>
            </div>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-slate-200 px-4 py-1 text-xs disabled:opacity-50 dark:border-zinc-700"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                >
                  Previous
                </button>
                <button
                  className="rounded-full border border-slate-200 px-4 py-1 text-xs dark:border-zinc-700"
                  onClick={() => {
                    if (!showCorrect) setSessionSkipped((s) => s + 1);
                    if (index >= total - 1) startNewRound();
                    else setIndex((i) => Math.min(total - 1, i + 1));
                  }}
                >
                  {index >= total - 1 ? "Start over" : "Next"}
                </button>
              </div>
              <ul className="space-y-3">
                {shuffledChoices.map((c, idx) => {
                  const isSelected = selectedId === c.id;
                  const stateClass = showCorrect
                    ? c.isCorrect
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-rose-400 bg-rose-50 text-rose-900"
                    : isSelected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 bg-white text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
                  const displayedLabel = labelForIndex(idx);
                  return (
                    <li key={c.id}>
                      <button
                        className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${stateClass}`}
                        onClick={() => setSelectedId(c.id)}
                      >
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600 shadow dark:bg-zinc-800">
                          {displayedLabel}
                        </span>
                        <span className="flex-1 text-sm">{c.text}</span>
                        {showCorrect ? (
                          <span className="text-xs font-semibold">
                            {c.isCorrect ? "Correct" : isSelected ? "Incorrect" : ""}
                          </span>
                        ) : null}
                      </button>
                      {showCorrect && c.explanation ? (
                        <div className="mt-1 rounded-2xl bg-slate-50 px-4 py-2 text-xs text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {c.explanation}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
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
                  Reveal answer
                </button>
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 dark:border-zinc-700 dark:text-zinc-200"
                  onClick={() => {
                    if (!showCorrect) setSessionSkipped((s) => s + 1);
                    if (index >= total - 1) startNewRound();
                    else setIndex((i) => Math.min(total - 1, i + 1));
                  }}
                >
                  {index >= total - 1 ? "Shuffle & retry" : "Skip"}
                </button>
              </div>
              {showCorrect && correct ? (
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
                  <div className="font-semibold">
                    Correct choice {displayedCorrectLabel}: {correct.text}
                  </div>
                  {current.explanation ? <div className="text-xs">{current.explanation}</div> : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white"
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
                      Mark learned
                    </button>
                    <button
                      className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 dark:border-zinc-600 dark:text-zinc-200"
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
                      Review again
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 lg:sticky lg:top-36">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Countdown timer</p>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="relative h-24 w-24 rounded-full bg-slate-100 p-3 dark:bg-zinc-800"
                  style={ringStyle(countdownPct, "#6366f1")}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-900 dark:bg-zinc-900 dark:text-zinc-50">
                    {countdownDisplay}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs text-slate-500 dark:text-zinc-400">
                    Minutes
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={timerInput}
                      onChange={(e) => setTimerInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1 text-sm dark:border-zinc-700 dark:bg-transparent"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="flex-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-zinc-900"
                      onClick={startCountdown}
                    >
                      {countdownRunning ? "Restart" : "Start"}
                    </button>
                    <button
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 dark:border-zinc-700 dark:text-zinc-200"
                      onClick={pauseCountdown}
                    >
                      Pause
                    </button>
                    <button
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 dark:border-zinc-700 dark:text-zinc-200"
                      onClick={resetCountdown}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <StatRing label="Remaining" value={remainingQuestions} pct={progressRemaining} color="#14b8a6" />
              <StatRing label="Correct" value={sessionCorrect} pct={progressCorrect} color="#4ade80" />
              <StatRing label="Incorrect" value={sessionIncorrect} pct={progressIncorrect} color="#fb7185" />
            </div>
            <div className="rounded-2xl bg-slate-50/80 p-3 text-xs text-slate-600 dark:bg-zinc-800/60 dark:text-zinc-300">
              <p className="uppercase tracking-[0.3em]">Session time</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-zinc-50">{timeStr}</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
