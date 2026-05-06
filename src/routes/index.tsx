import { createFileRoute } from "@tanstack/react-router";
import { FlowchartEditor } from "@/components/flowchart/FlowchartEditor";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "FluxoLab — Criador de Fluxogramas ISO 5807" },
      {
        name: "description",
        content:
          "Ferramenta visual para criar fluxogramas seguindo a ISO 5807. Ideal para aulas de lógica de programação e algoritmos.",
      },
    ],
  }),
});

function Index() {
  return <FlowchartEditor />;
}
