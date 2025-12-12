"use client";

import { useState } from "react";

type NewSubchapterProps = {
  chapterId: string;
  variant?: "panel" | "inline";
};

export default function NewSubchapter({ chapterId, variant = "panel" }: NewSubchapterProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (loading) return;
    const trimmed = title.trim();
    const payload: { chapterId: string; title?: string } = { chapterId };
    if (trimmed) payload.title = trimmed;

    setLoading(true);
    try {
      const r = await fetch("/api/subchapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        setTitle("");
        location.reload();
      } else {
        throw new Error(await r.text());
      }
    } catch (e) {
      alert((e as Error).message || "Failed to create subchapter");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    variant === "inline"
      ? "flex-1 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/70"
      : "flex-1 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-base focus:border-indigo-300 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/70";

  const buttonClass =
    variant === "inline"
      ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      : "rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60";

  if (variant === "inline") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className={inputClass}
          placeholder="Subchapter title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <button className={buttonClass} onClick={create} disabled={loading}>
          {loading ? "Adding..." : "Add subchapter"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">New subchapter</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-zinc-50">Break topics into smaller lessons</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        Use subchapters for class sessions, problem sets, or flashcard groupings.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className={inputClass}
          placeholder="e.g., Sensory neurons"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <button className={buttonClass} onClick={create} disabled={loading}>
          {loading ? "Adding..." : "Create subchapter"}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">
        Keep names short so they fit on practice tabs.
      </p>
    </div>
  );
}
