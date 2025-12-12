"use client";
import { useState } from "react";

type NewBookProps = {
  compact?: boolean;
};

export default function NewBook({ compact = false }: NewBookProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!title.trim() || loading) return;
    setLoading(true);
    try {
      const r = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!r.ok) throw new Error(await r.text());
      location.reload();
    } catch (err) {
      alert((err as Error).message || "Failed to create book");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = compact
    ? "flex-1 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/70"
    : "flex-1 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-base focus:border-indigo-300 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/60";

  const buttonClass = compact
    ? "rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
    : "rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60";

  if (compact) {
    return (
      <div className="w-full max-w-md space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className={inputClass}
            placeholder="Give your book a name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <button className={buttonClass} onClick={create} disabled={loading}>
            {loading ? "Adding..." : "Create"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">New book</p>
      <h2 className="mt-2 text-xl font-semibold">Start a fresh collection</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        Use books for courses, exams, or projects. Add chapters right after creating it.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className={inputClass}
          placeholder="e.g., Biology Term 2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <button className={buttonClass} onClick={create} disabled={loading}>
          {loading ? "Adding..." : "Add book"}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">
        Pro tip: keep names short so they fit nicely on the sidebar.
      </p>
    </div>
  );
}



