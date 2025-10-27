"use client";

import { useState } from "react";

export default function NewSubchapter({
  chapterId,
}: {
  chapterId: string;
}) {
  const [title, setTitle] = useState("");

  const create = async () => {
    const payload: { chapterId: string; title?: string } = { chapterId };
    if (title.trim()) payload.title = title.trim();

    const r = await fetch("/api/subchapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      setTitle("");
      location.reload();
    } else {
      alert(await r.text());
    }
  };

  return (
    <div className="flex gap-2">
      <input
        className="rounded-md border px-3 py-2"
        placeholder="New subchapter title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
      />
      <button className="border px-3 py-2 rounded-md" onClick={create}>
        Add Subchapter
      </button>
    </div>
  );
}
