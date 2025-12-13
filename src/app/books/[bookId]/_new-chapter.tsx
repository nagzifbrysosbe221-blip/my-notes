"use client";
import { useState } from "react";

type NewChapterProps = {
  bookId: string;
  variant?: "panel" | "inline";
};

export default function NewChapter({ bookId, variant = "panel" }: NewChapterProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (!title.trim() || loading) return;
    setLoading(true);
    try {
      const body: { bookId: string; title?: string } = { bookId };
      if (title.trim()) body.title = title.trim();
      const r = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      setTitle("");
      location.reload();
    } catch (err) {
      alert((err as Error).message || "Failed to create chapter");
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
          placeholder="New chapter title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <button className={buttonClass} onClick={create} disabled={loading}>
          {loading ? "Adding..." : "Add chapter"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">New chapter</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-zinc-50">Add a major topic</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        Chapters are perfect for units or big ideas. You can add subchapters once this is created.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className={inputClass}
          placeholder="e.g., Nervous System"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <button className={buttonClass} onClick={create} disabled={loading}>
          {loading ? "Adding..." : "Create chapter"}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">
        Tip: keep names action-oriented (&ldquo;Master cell division&rdquo;) to stay motivated.
      </p>
    </div>
  );
}
