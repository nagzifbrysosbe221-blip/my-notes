"use client";
import { useEffect, useRef, useState } from "react";
import SubItem from "./SubItem";

type Item = { id: string; title?: string | null };

export default function SubList({ chapterId, items }: { chapterId: string; items: Item[] }) {
  const [list, setList] = useState(items);
  const dragIndex = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setList(items), [items]);

  function onDragStart(i: number) {
    dragIndex.current = i;
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
    try {
      const r = await fetch(`/api/subchapters/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, order }),
      });
      if (!r.ok) throw new Error(await r.text());
    } catch (e) {
      setError((e as Error).message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {list.map((sub, i) => (
        <div
          key={sub.id}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDrop={onDrop}
        >
          <SubItem subchapter={sub} index={i} />
          {saving ? <div className="px-3 pb-1 text-right text-xs text-zinc-500">Saving…</div> : null}
        </div>
      ))}
    </div>
  );
}
