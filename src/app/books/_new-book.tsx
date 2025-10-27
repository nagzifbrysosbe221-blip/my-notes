"use client";
import { useState } from "react";

export default function NewBook() {
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
      // simplest refresh; can be swapped for router.refresh()
      location.reload();
    } catch (err) {
      alert((err as Error).message || "Failed to create book");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        className="w-56 rounded-md border px-3 py-2"
        placeholder="New Book"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
      />
      <button
        className="rounded-md border px-3 py-2 disabled:opacity-60"
        onClick={create}
        disabled={loading}
      >
        {loading ? "Adding…" : "Add"}
      </button>
    </div>
  );
}



