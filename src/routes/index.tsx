import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FlowchartEditor } from "@/components/flowchart/FlowchartEditor";
import { CriticalThinkingLab } from "@/components/flowchart/CriticalThinkingLab";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "FluxoLab — Criador de Fluxogramas ISO 5807" },
      {
        name: "description",
        content:
          "Ferramenta visual para criar fluxogramas seguindo a ISO 5807 com desafios de pensamento lógico para aulas de algoritmos.",
      },
    ],
  }),
});

type Mode = "editor" | "desafios";

function Index() {
  const [mode, setMode] = useState<Mode>("editor");

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <nav className="flex shrink-0 items-center gap-1 border-b border-border bg-card px-4 py-2">
        <button
          onClick={() => setMode("editor")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            mode === "editor"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Editor de Fluxogramas
        </button>
        <button
          onClick={() => setMode("desafios")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            mode === "desafios"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Desafios de Lógica
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          ISO 5807 · Lógica Formal aplicada a Algoritmos
        </span>
      </nav>
      <div className="flex-1 overflow-hidden">
        {mode === "editor" ? <FlowchartEditor /> : <CriticalThinkingLab />}
      </div>
    </div>
  );
}
