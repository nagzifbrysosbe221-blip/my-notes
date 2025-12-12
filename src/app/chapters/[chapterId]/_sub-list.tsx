"use client";
import { useEffect, useRef, useState } from "react";
import SubItem from "./SubItem";

type Item = { id: string; title?: string | null; createdAt?: string | null };

export default function SubList({ chapterId, items }: { chapterId: string; items: Item[] }) {
  const [list, setList] = useState(items);
  const dragIndex = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => setList(items), [items]);

  function onDragStart(i: number) {
    dragIndex.current = i;
    setSaved(false);
  }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    const from = dragIndex.current;
    if (from == null || from === i) return;
    setList((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      dragIndex.current = i;
      return next;
    });
  }
  async function onDrop() {
    const order = list.map((x) => x.id);
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const r = await fetch(`/api/subchapters/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, order }),
      });
      if (!r.ok) throw new Error(await r.text());
      setSaved(true);
    } catch (e) {
      setError((e as Error).message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  }

  if (list.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
        No subchapters yet. Use the panel on the right to add your first one.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path d="M9 4h6M9 20h6M5 8h14M5 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Drag cards to reorder your lesson plan.
          </div>
          <div className="text-xs font-semibold">
            {saving ? "Saving..." : saved ? "Order saved" : null}
          </div>
        </div>
        {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
      {list.map((sub, i) => (
        <div
          key={sub.id}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDrop={onDrop}
          className="cursor-move"
        >
          <SubItem subchapter={sub} index={i} />
        </div>
      ))}
    </div>
  );
}
