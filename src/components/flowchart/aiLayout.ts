import { SYMBOLS } from "./symbols";
import type { FlowDoc, FlowEdge, FlowNode } from "./types";
import type { GeneratedFlow } from "@/lib/flowchart-ai.functions";

// Layout simples top-down em camadas (longest-path layering) com separação horizontal
// para ramos de decisão. O posicionamento exato não é tão importante — o usuário
// pode reorganizar arrastando os nós no editor.
export function layoutGeneratedFlow(gen: GeneratedFlow): FlowDoc {
  const ids = gen.nodes.map((n) => n.id);
  const idSet = new Set(ids);
  // Mantém apenas arestas válidas
  const edges = gen.edges.filter((e) => idSet.has(e.from) && idSet.has(e.to));

  const adj = new Map<string, string[]>();
  ids.forEach((id) => adj.set(id, []));
  edges.forEach((e) => adj.get(e.from)!.push(e.to));

  // Camadas via longest-path (BFS topológica simples)
  const inDeg = new Map<string, number>();
  ids.forEach((id) => inDeg.set(id, 0));
  edges.forEach((e) => inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1));

  const layer = new Map<string, number>();
  const queue: string[] = [];
  inDeg.forEach((d, id) => {
    if (d === 0) {
      layer.set(id, 0);
      queue.push(id);
    }
  });
  // fallback: se nada com in-degree 0 (ciclo), começa pelo primeiro
  if (queue.length === 0 && ids.length > 0) {
    layer.set(ids[0], 0);
    queue.push(ids[0]);
  }

  const visited = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const lv = layer.get(id) ?? 0;
    for (const nb of adj.get(id) ?? []) {
      const next = Math.max(layer.get(nb) ?? 0, lv + 1);
      layer.set(nb, next);
      queue.push(nb);
    }
  }
  // garantir que nós não visitados recebam uma camada
  ids.forEach((id) => {
    if (!layer.has(id)) layer.set(id, 0);
  });

  // Agrupa por camada
  const byLayer = new Map<number, string[]>();
  layer.forEach((lv, id) => {
    if (!byLayer.has(lv)) byLayer.set(lv, []);
    byLayer.get(lv)!.push(id);
  });

  const ROW_H = 150;
  const COL_W = 230;
  const ORIGIN_X = 500;
  const ORIGIN_Y = 80;

  const nodes: FlowNode[] = [];
  const sortedLayers = [...byLayer.keys()].sort((a, b) => a - b);
  for (const lv of sortedLayers) {
    const cols = byLayer.get(lv)!;
    const total = cols.length;
    cols.forEach((id, i) => {
      const def = SYMBOLS[gen.nodes.find((n) => n.id === id)!.kind];
      const offset = (i - (total - 1) / 2) * COL_W;
      nodes.push({
        id,
        kind: gen.nodes.find((n) => n.id === id)!.kind,
        label: gen.nodes.find((n) => n.id === id)!.label,
        x: ORIGIN_X + offset,
        y: ORIGIN_Y + lv * ROW_H,
        w: def.defaultWidth,
        h: def.defaultHeight,
      });
    });
  }

  const flowEdges: FlowEdge[] = edges.map((e, i) => ({
    id: `ai-e${i + 1}`,
    from: e.from,
    to: e.to,
    label: e.label,
  }));

  return { nodes, edges: flowEdges };
}
