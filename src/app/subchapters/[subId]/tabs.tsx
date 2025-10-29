"use client";
import { useState } from "react";
import NotesEditor from "./NotesEditor";

export default function Tabs({ subId }: { subId: string }) {
  const [tab, setTab] = useState<"notes" | "questions">("notes");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <button
          className={`px-3 py-2 text-sm ${
            tab === "notes" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"
          }`}
          onClick={() => setTab("notes")}
        >
          Notes
        </button>
        <button
          className={`px-3 py-2 text-sm ${
            tab === "questions" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"
          }`}
          onClick={() => setTab("questions")}
        >
          Questions
        </button>
      </div>

      {tab === "notes" ? (
        <NotesEditor subId={subId} />
      ) : (
        <div className="text-sm text-zinc-500">Questions coming soon.</div>
      )}
    </div>
  );
}

