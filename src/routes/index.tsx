import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { FlowchartEditor } from "@/components/flowchart/FlowchartEditor";
import { CriticalThinkingLab } from "@/components/flowchart/CriticalThinkingLab";
import {
  APP_SETTINGS_CHANGED_EVENT,
  applyAppSettings,
  loadAppSettings,
} from "@/components/settings/appSettings";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const syncSettings = () => applyAppSettings(loadAppSettings());
    syncSettings();
    window.addEventListener(APP_SETTINGS_CHANGED_EVENT, syncSettings);
    return () => window.removeEventListener(APP_SETTINGS_CHANGED_EVENT, syncSettings);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("settings") === "1") setSettingsOpen(true);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <nav className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border bg-card px-3 py-2 sm:px-4">
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
        <span className="ml-auto hidden text-xs text-muted-foreground md:inline">
          ISO 5807 · Lógica Formal aplicada a Algoritmos
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="Configurações"
          aria-label="Abrir configurações"
        >
          <Settings aria-hidden className="size-4" />
        </button>
        <ThemeToggle />
      </nav>
      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === "editor" ? <FlowchartEditor /> : <CriticalThinkingLab />}
      </div>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
