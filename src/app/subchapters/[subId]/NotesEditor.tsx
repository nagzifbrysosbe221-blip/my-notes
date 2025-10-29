"use client";
import { useMemo, useState } from "react";

const NOTE_TYPES = [
  "CORE",
  "INTERMEDIATE",
  "ADVANCED",
  "PERIPHERAL",
  "MISC",
] as const;

export default function NotesEditor({ subId }: { subId: string }) {
  const [noteType, setNoteType] = useState<(typeof NOTE_TYPES)[number]>("CORE");
  const [title, setTitle] = useState("");
  const [plain, setPlain] = useState("");
  const [saving, setSaving] = useState(false);

  // Minimal TipTap-like JSON from plain text
  const contentJSON = useMemo(() => {
    const text = plain.trim();
    if (!text) return { type: "doc", content: [] };
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text }],
        },
      ],
    } as const;
  }, [plain]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subchapterId: subId,
          type: noteType,
          title: title.trim() || undefined,
          contentJSON,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setTitle("");
      setPlain("");
      // optional: refresh or toast; keeping simple
      alert("Saved");
    } catch (e) {
      alert((e as Error).message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-md border px-2 py-1 text-sm"
          value={noteType}
          onChange={(e) => setNoteType(e.target.value as (typeof NOTE_TYPES)[number])}
        >
          {NOTE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          className="min-w-56 flex-1 rounded-md border px-2 py-1 text-sm"
          placeholder="Optional title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Note"}
        </button>
      </div>

      {/* Placeholder for Tiptap - using simple textarea for now */}
      <div className="rounded-md border">
        <textarea
          className="w-full min-h-40 resize-vertical px-3 py-2 outline-none"
          placeholder="Write your note... (Tiptap placeholder)"
          value={plain}
          onChange={(e) => setPlain(e.target.value)}
        />
      </div>

      <details className="text-xs text-zinc-500">
        <summary>Preview JSON</summary>
        <pre className="overflow-auto p-2">
{JSON.stringify(contentJSON, null, 2)}
        </pre>
      </details>
    </div>
  );
}

