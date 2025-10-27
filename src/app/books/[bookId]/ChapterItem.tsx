"use client";
import { useState } from "react";

type Chapter = { id: string; title?: string | null };

export default function ChapterItem({ chapter, index }: { chapter: Chapter; index: number }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chapter.title ?? `Chapter ${index + 1}`);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const t = title.trim();
    if (!t) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/chapters/${chapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (!r.ok) throw new Error(await r.text());
      setEditing(false);
      // simplest reload; could use router.refresh() if page was server-rendered
      location.reload();
    } catch (e) {
      alert((e as Error).message || "Failed to rename");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <span>{chapter.title ?? `Chapter ${index + 1}`}</span>
        <button className="rounded-md border px-2 py-1 text-sm" onClick={() => setEditing(true)}>
          Rename
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border p-3">
      <input
        className="flex-1 rounded-md border px-2 py-1"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        autoFocus
      />
      <button
        className="rounded-md border px-2 py-1 text-sm disabled:opacity-60"
        onClick={save}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button className="rounded-md border px-2 py-1 text-sm" onClick={() => setEditing(false)}>
        Cancel
      </button>
    </div>
  );
}
