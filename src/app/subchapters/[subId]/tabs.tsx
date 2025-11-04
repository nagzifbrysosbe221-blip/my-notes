"use client";
import { useState } from "react";
import MCQPractice from "./_mcq-practice";
import MCQImport from "./_mcq-import";
import MCQCards from "./_mcq-cards";
import ShortImport from "./_short-import";
import ShortCards from "./_short-cards";
import ShortPractice from "./_short-practice";
import CreativeImport from "./_creative-import";
import CreativeCards from "./_creative-cards";
import CreativePractice from "./_creative-practice";
import ScenarioPractice from "./_scenario-practice";
import ScenarioImport from "./_scenario-import";
import ScenarioCards from "./_scenario-cards";

type QType = "mcq" | "short" | "creative" | "scenario";

export default function Tabs({ subId }: { subId: string }) {
  const [qType, setQType] = useState<QType>("mcq");
  const [mcqTab, setMcqTab] = useState<"practice" | "import" | "view">("practice");
  const [shortTab, setShortTab] = useState<"practice" | "import" | "view">("practice");
  const [creativeTab, setCreativeTab] = useState<"practice" | "import" | "view">("practice");
  const [scenarioTab, setScenarioTab] = useState<"practice" | "import" | "view">("practice");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        {([
          { key: "mcq", label: "MCQ" },
          { key: "short", label: "Short Answer" },
          { key: "creative", label: "Creative Thinking" },
          { key: "scenario", label: "Scenario Question" },
        ] as const).map((t) => (
          <button
            key={t.key}
            className={`px-3 py-2 text-sm ${qType === t.key ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
            onClick={() => setQType(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {qType === "mcq" ? (
        <div className="space-y-3">
          <div className="flex gap-2 border-b">
            <button
              className={`px-3 py-2 text-sm ${mcqTab === "practice" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setMcqTab("practice")}
            >
              Practice
            </button>
            <button
              className={`px-3 py-2 text-sm ${mcqTab === "import" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setMcqTab("import")}
            >
              Import Questions
            </button>
            <button
              className={`px-3 py-2 text-sm ${mcqTab === "view" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setMcqTab("view")}
            >
              View Cards
            </button>
          </div>

          {mcqTab === "practice" ? (
            <MCQPractice subId={subId} />
          ) : mcqTab === "import" ? (
            <MCQImport subId={subId} />
          ) : (
            <MCQCards subId={subId} />
          )}
        </div>
      ) : qType === "short" ? (
        <div className="space-y-3">
          <div className="flex gap-2 border-b">
            <button
              className={`px-3 py-2 text-sm ${shortTab === "practice" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setShortTab("practice")}
            >
              Practice
            </button>
            <button
              className={`px-3 py-2 text-sm ${shortTab === "import" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setShortTab("import")}
            >
              Import Questions
            </button>
            <button
              className={`px-3 py-2 text-sm ${shortTab === "view" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setShortTab("view")}
            >
              View Cards
            </button>
          </div>
          {shortTab === "practice" ? <ShortPractice subId={subId} /> : shortTab === "import" ? <ShortImport subId={subId} /> : <ShortCards subId={subId} />}
        </div>
      ) : qType === "creative" ? (
        <div className="space-y-3">
          <div className="flex gap-2 border-b">
            <button
              className={`px-3 py-2 text-sm ${creativeTab === "practice" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setCreativeTab("practice")}
            >
              Practice
            </button>
            <button
              className={`px-3 py-2 text-sm ${creativeTab === "import" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setCreativeTab("import")}
            >
              Import Questions
            </button>
            <button
              className={`px-3 py-2 text-sm ${creativeTab === "view" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setCreativeTab("view")}
            >
              View Cards
            </button>
          </div>
          {creativeTab === "practice" ? (
            <CreativePractice subId={subId} />
          ) : creativeTab === "import" ? (
            <CreativeImport subId={subId} />
          ) : (
            <CreativeCards subId={subId} />
          )}
        </div>
      ) : qType === "scenario" ? (
        <div className="space-y-3">
          <div className="flex gap-2 border-b">
            <button
              className={`px-3 py-2 text-sm ${scenarioTab === "practice" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setScenarioTab("practice")}
            >
              Practice
            </button>
            <button
              className={`px-3 py-2 text-sm ${scenarioTab === "import" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setScenarioTab("import")}
            >
              Import Questions
            </button>
            <button
              className={`px-3 py-2 text-sm ${scenarioTab === "view" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}
              onClick={() => setScenarioTab("view")}
            >
              View Cards
            </button>
          </div>
          {scenarioTab === "practice" ? (
            <ScenarioPractice subId={subId} />
          ) : scenarioTab === "import" ? (
            <ScenarioImport subId={subId} />
          ) : (
            <ScenarioCards subId={subId} />
          )}
        </div>
      ) : null}
    </div>
  );
}
