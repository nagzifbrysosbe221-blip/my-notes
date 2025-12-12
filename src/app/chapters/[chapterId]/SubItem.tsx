"use client";
import Link from "next/link";
import { useState } from "react";

const formatDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

type Subchapter = { id: string; title?: string | null; createdAt?: string | null };

export default function SubItem({
  subchapter,
  index,
}: {
  subchapter: Subchapter;
  index: number;
}) {
  const defaultTitle = subchapter.title?.trim() || `Subchapter ${index + 1}`;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    const t = title.trim();
    if (!t) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/subchapters/${subchapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (!r.ok) throw new Error(await r.text());
      setEditing(false);
      location.reload();
    } catch (e) {
      alert((e as Error).message || "Failed to rename");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this subchapter? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/subchapters/${subchapter.id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error(await r.text());
      location.reload();
    } catch (e) {
      alert((e as Error).message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Rename subchapter</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              className="rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="rounded-2xl border border-slate-200 px-5 py-2 text-sm font-semibold dark:border-zinc-700"
              onClick={() => {
                setTitle(defaultTitle);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-500/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Subchapter {String(index + 1).padStart(2, "0")}
          </p>
          <Link
            href={`/subchapters/${subchapter.id}`}
            className="mt-1 inline-flex text-lg font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-zinc-50"
          >
            {defaultTitle}
          </Link>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-200"
            onClick={() => setEditing(true)}
          >
            Rename
          </button>
          <button
            className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-zinc-900/70">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Ready for practice
        </span>
        {subchapter.createdAt ? (
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
              <path d="M6 8h12M7 4v4m10-4v4M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="5" y="8" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            Added {formatDate.format(new Date(subchapter.createdAt))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
