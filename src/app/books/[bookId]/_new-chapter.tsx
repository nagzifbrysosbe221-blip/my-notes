"use client";
import { useState } from "react";

export default function NewChapter({ bookId }: { bookId: string }) {
  const [title, setTitle] = useState("");

  const create = async () => {
    const body: any = { bookId };
    if (title.trim()) body.title = title.trim(); // send only if provided

    const r = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) location.reload();
    else alert(await r.text());
  };

  return (
    <div className="flex gap-2">
      <input
        className="rounded-md border px-3 py-2"
        placeholder="New chapter title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
      />
      <button className="border px-3 py-2 rounded-md" onClick={create}>
        Add Chapter
      </button>
    </div>
  );
}



