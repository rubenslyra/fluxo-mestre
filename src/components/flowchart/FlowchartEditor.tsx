import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SYMBOLS, type SymbolKind } from "./symbols";
import { SymbolPreview, NodeShape } from "./NodeShape";
import { edgePath } from "./geometry";
import type { FlowDoc, FlowNode } from "./types";
import { AiGeneratorPanel } from "./AiGeneratorPanel";
import { validateFlow } from "./validation";
import { downloadPng, downloadSvg } from "./exportImage";

const STORAGE_KEY = "flowchart-doc-v1";

const initialDoc: FlowDoc = {
  nodes: [
    { id: "n1", kind: "terminator", x: 400, y: 80, w: 140, h: 60, label: "Início" },
    { id: "n2", kind: "manual", x: 400, y: 200, w: 170, h: 70, label: "Ler N" },
    { id: "n3", kind: "decision", x: 400, y: 340, w: 170, h: 100, label: "N > 0?" },
    { id: "n4", kind: "display", x: 600, y: 340, w: 180, h: 70, label: "Exibir 'Positivo'" },
    { id: "n5", kind: "display", x: 200, y: 340, w: 180, h: 70, label: "Exibir 'Não positivo'" },
    { id: "n6", kind: "terminator", x: 400, y: 500, w: 140, h: 60, label: "Fim" },
  ],
  edges: [
    { id: "e1", from: "n1", to: "n2" },
    { id: "e2", from: "n2", to: "n3" },
    { id: "e3", from: "n3", to: "n4", label: "Sim" },
    { id: "e4", from: "n3", to: "n5", label: "Não" },
    { id: "e5", from: "n4", to: "n6" },
    { id: "e6", from: "n5", to: "n6" },
  ],
};

function loadDoc(): FlowDoc {
  if (typeof window === "undefined") return initialDoc;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialDoc;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const EXPORT_PREFS_KEY = "flowchart-export-prefs-v1";
type ExportFormat = "png" | "svg";
function loadExportPrefs(): { format: ExportFormat; scale: number } {
  if (typeof window === "undefined") return { format: "png", scale: 2 };
  try {
    const raw = localStorage.getItem(EXPORT_PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const scale = Math.max(1, Math.min(4, Number(p.scale) || 2));
      const format: ExportFormat = p.format === "svg" ? "svg" : "png";
      return { format, scale };
    }
  } catch {}
  return { format: "png", scale: 2 };
}

export function FlowchartEditor() {
  const [doc, setDocRaw] = useState<FlowDoc>(() => loadDoc());
  const [past, setPast] = useState<FlowDoc[]>([]);
  const [future, setFuture] = useState<FlowDoc[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [pendingEdge, setPendingEdge] = useState<{ from: string; x: number; y: number } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [exportMenu, setExportMenu] = useState(false);
  const initialPrefs = loadExportPrefs();
  const [exportScale, setExportScale] = useState(initialPrefs.scale);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(initialPrefs.format);
  useEffect(() => {
    try {
      localStorage.setItem(EXPORT_PREFS_KEY, JSON.stringify({ format: exportFormat, scale: exportScale }));
    } catch {}
  }, [exportFormat, exportScale]);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const docRef = useRef(doc);
  docRef.current = doc;

  // Snapshot current doc into the undo stack and clear redo
  const commit = useCallback(() => {
    setPast((p) => [...p.slice(-49), JSON.parse(JSON.stringify(docRef.current)) as FlowDoc]);
    setFuture([]);
  }, []);

  // setDoc that also commits the previous state to history
  type DocUpdater = FlowDoc | ((d: FlowDoc) => FlowDoc);
  const setDoc = useCallback((updater: DocUpdater) => {
    commit();
    setDocRaw((d) => (typeof updater === "function" ? (updater as (d: FlowDoc) => FlowDoc)(d) : updater));
  }, [commit]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [JSON.parse(JSON.stringify(docRef.current)) as FlowDoc, ...f].slice(0, 50));
      setDocRaw(prev);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p.slice(-49), JSON.parse(JSON.stringify(docRef.current)) as FlowDoc]);
      setDocRaw(next);
      return f.slice(1);
    });
  }, []);

  const matchedIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return new Set(doc.nodes.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id));
  }, [search, doc.nodes]);

  const applyAiDoc = (incoming: FlowDoc, mode: "replace" | "merge") => {
    if (mode === "replace") {
      setDoc(incoming);
      return;
    }
    // merge: prefixar ids para evitar colisão
    const prefix = "ai_" + Math.random().toString(36).slice(2, 6) + "_";
    const remap = new Map<string, string>();
    incoming.nodes.forEach((n) => remap.set(n.id, prefix + n.id));
    const offsetX = 0;
    const offsetY = (Math.max(0, ...doc.nodes.map((n) => n.y + n.h / 2)) || 0) + 80;
    const newNodes = incoming.nodes.map((n) => ({ ...n, id: remap.get(n.id)!, x: n.x + offsetX, y: n.y + offsetY }));
    const newEdges = incoming.edges.map((e) => ({ ...e, id: prefix + e.id, from: remap.get(e.from)!, to: remap.get(e.to)! }));
    setDoc((d) => ({ nodes: [...d.nodes, ...newNodes], edges: [...d.edges, ...newEdges] }));
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch {}
  }, [doc]);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (sx - rect.left - view.x) / view.k,
        y: (sy - rect.top - view.y) / view.k,
      };
    },
    [view],
  );

  const addNode = (kind: SymbolKind) => {
    const def = SYMBOLS[kind];
    const rect = svgRef.current?.getBoundingClientRect();
    const cx = rect ? (rect.width / 2 - view.x) / view.k : 400;
    const cy = rect ? (rect.height / 2 - view.y) / view.k : 300;
    const node: FlowNode = {
      id: uid(),
      kind,
      x: cx,
      y: cy,
      w: def.defaultWidth,
      h: def.defaultHeight,
      label: def.defaultLabel,
    };
    setDoc((d) => ({ ...d, nodes: [...d.nodes, node] }));
    setSelected(node.id);
  };

  const updateNode = (id: string, patch: Partial<FlowNode>) =>
    setDoc((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));

  const deleteSelected = () => {
    if (!selected) return;
    setDoc((d) => ({
      nodes: d.nodes.filter((n) => n.id !== selected),
      edges: d.edges.filter((e) => e.from !== selected && e.to !== selected),
    }));
    setSelected(null);
  };

  const handleNodeMouseDown = (node: FlowNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(node.id);
    const w = screenToWorld(e.clientX, e.clientY);
    dragRef.current = { id: node.id, offX: w.x - node.x, offY: w.y - node.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const w = screenToWorld(e.clientX, e.clientY);
      const { id, offX, offY } = dragRef.current;
      updateNode(id, { x: Math.round((w.x - offX) / 8) * 8, y: Math.round((w.y - offY) / 8) * 8 });
    } else if (pendingEdge) {
      const w = screenToWorld(e.clientX, e.clientY);
      setPendingEdge({ ...pendingEdge, x: w.x, y: w.y });
    } else if (panRef.current) {
      setView((v) => ({
        ...v,
        x: panRef.current!.vx + (e.clientX - panRef.current!.x),
        y: panRef.current!.vy + (e.clientY - panRef.current!.y),
      }));
    }
  };

  const handleMouseUp = () => {
    dragRef.current = null;
    panRef.current = null;
    setPendingEdge(null);
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    setSelected(null);
    panRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  };

  const startEdge = (fromId: string, e: React.MouseEvent) => {
    const w = screenToWorld(e.clientX, e.clientY);
    setPendingEdge({ from: fromId, x: w.x, y: w.y });
  };

  const finishEdgeOn = (toId: string) => {
    if (!pendingEdge || pendingEdge.from === toId) return;
    setDoc((d) => ({
      ...d,
      edges: [...d.edges, { id: uid(), from: pendingEdge.from, to: toId }],
    }));
    setPendingEdge(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setView((v) => {
      const nk = Math.max(0.3, Math.min(2.5, v.k * factor));
      return {
        k: nk,
        x: mx - (mx - v.x) * (nk / v.k),
        y: my - (my - v.y) * (nk / v.k),
      };
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const promptLabel = (node: FlowNode) => {
    const v = window.prompt("Texto do símbolo:", node.label);
    if (v !== null) updateNode(node.id, { label: v });
  };

  const getInner = () => svgRef.current?.querySelector("#world")?.innerHTML ?? "";

  const exportSVG = () => {
    if (doc.nodes.length === 0) return;
    downloadSvg(doc, getInner());
  };

  const exportPNG = async (scale: number) => {
    if (doc.nodes.length === 0) return;
    await downloadPng(doc, getInner(), scale);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fluxograma.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as FlowDoc;
        if (parsed.nodes && parsed.edges) setDoc(parsed);
      } catch {
        alert("Arquivo inválido");
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (confirm("Limpar todo o fluxograma?")) setDoc({ nodes: [], edges: [] });
  };

  const loadExample = () => setDoc(initialDoc);

  const selectedNode = doc.nodes.find((n) => n.id === selected) ?? null;

  const validation = validateFlow(doc);

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight">FluxoLab</h1>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            ISO 5807 · Lógica & Algoritmos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiOpen(true)}
            className="rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            title="Gerar fluxograma a partir de descrição com IA"
          >
            🤖 Gerar com IA
          </button>
          <button onClick={loadExample} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
            Exemplo
          </button>
          <label className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
            Importar JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])}
            />
          </label>
          <button onClick={exportJSON} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
            Exportar JSON
          </button>
          <div className="relative">
            <button
              onClick={() => setExportMenu((v) => !v)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Exportar imagem ▾
            </button>
            {exportMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-card p-3 text-sm shadow-xl">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Escala (PNG)
                </p>
                <div className="mb-3 flex gap-1">
                  {[1, 2, 3, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setExportScale(s)}
                      className={`flex-1 rounded border px-2 py-1 text-xs ${
                        exportScale === s
                          ? "border-primary bg-primary/10 font-semibold text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setExportMenu(false);
                    void exportPNG(exportScale);
                  }}
                  className="mb-1 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Baixar PNG ({exportScale}x)
                </button>
                <button
                  onClick={() => {
                    setExportMenu(false);
                    exportSVG();
                  }}
                  className="w-full rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Baixar SVG (vetorial)
                </button>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  PNG ideal para apresentações/impressão. SVG mantém qualidade infinita.
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <AiGeneratorPanel open={aiOpen} onClose={() => setAiOpen(false)} onApply={applyAiDoc} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-border bg-card p-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Buscar no fluxo
          </h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por texto do símbolo…"
            className="mb-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <p className="mb-3 text-[11px] text-muted-foreground">
              {matchedIds?.size ?? 0} símbolo{(matchedIds?.size ?? 0) === 1 ? "" : "s"} encontrado
              {(matchedIds?.size ?? 0) === 1 ? "" : "s"}
            </p>
          )}

          <h2 className="mb-3 mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Símbolos ISO 5807
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(SYMBOLS) as SymbolKind[]).map((k) => (
              <button
                key={k}
                onClick={() => addNode(k)}
                title={SYMBOLS[k].description}
                className="group flex flex-col items-center gap-1 rounded-lg border border-border bg-background p-2 text-center transition hover:border-accent hover:shadow-sm"
              >
                <SymbolPreview kind={k} size={44} />
                <span className="text-[11px] font-medium leading-tight">{SYMBOLS[k].name}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Como usar</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Clique num símbolo para adicionar</li>
              <li>Arraste para posicionar</li>
              <li>Duplo-clique para editar texto</li>
              <li>Arraste a bolinha amarela até outro símbolo para conectar</li>
              <li>Delete remove o selecionado</li>
              <li>Roda do mouse: zoom · Arrastar fundo: mover</li>
            </ul>
          </div>

          <button
            onClick={clearAll}
            className="mt-4 w-full rounded-md border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            Limpar tudo
          </button>
        </aside>

        {/* Canvas */}
        <main className="relative flex-1 overflow-hidden bg-canvas">
          <div className="bg-grid absolute inset-0" />
          <svg
            ref={svgRef}
            className="relative h-full w-full"
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-edge)" />
              </marker>
            </defs>
            <g id="world" transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
              {/* edges */}
              {doc.edges.map((e) => {
                const from = doc.nodes.find((n) => n.id === e.from);
                const to = doc.nodes.find((n) => n.id === e.to);
                if (!from || !to) return null;
                const { d, mid } = edgePath(from, to);
                return (
                  <g key={e.id}>
                    <path
                      d={d}
                      fill="none"
                      stroke="var(--color-edge)"
                      strokeWidth={2}
                      markerEnd="url(#arrow)"
                    />
                    {e.label && (
                      <g transform={`translate(${mid.x}, ${mid.y})`}>
                        <rect x={-18} y={-10} width={36} height={18} rx={4} fill="var(--color-card)" stroke="var(--color-border)" />
                        <text textAnchor="middle" y={4} fontSize={11} fill="var(--color-foreground)">
                          {e.label}
                        </text>
                      </g>
                    )}
                    <path
                      d={d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={12}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        const lbl = window.prompt("Rótulo da seta (ex: Sim/Não)", e.label ?? "");
                        if (lbl !== null) {
                          setDoc((d2) => ({
                            ...d2,
                            edges: d2.edges.map((x) => (x.id === e.id ? { ...x, label: lbl || undefined } : x)),
                          }));
                        }
                      }}
                      onDoubleClick={(ev) => {
                        ev.stopPropagation();
                        if (confirm("Remover esta conexão?"))
                          setDoc((d2) => ({ ...d2, edges: d2.edges.filter((x) => x.id !== e.id) }));
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </g>
                );
              })}

              {/* pending edge */}
              {pendingEdge && (() => {
                const from = doc.nodes.find((n) => n.id === pendingEdge.from);
                if (!from) return null;
                return (
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={pendingEdge.x}
                    y2={pendingEdge.y}
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                );
              })()}

              {/* nodes */}
              {doc.nodes.map((n) => {
                const dim = matchedIds && !matchedIds.has(n.id);
                return (
                  <g key={n.id} style={{ opacity: dim ? 0.25 : 1, transition: "opacity .15s" }}>
                    <NodeShape
                      node={n}
                      selected={selected === n.id || (matchedIds?.has(n.id) ?? false)}
                      onMouseDown={(e) => handleNodeMouseDown(n, e)}
                      onDoubleClick={() => promptLabel(n)}
                      onPortMouseDown={(_, e) => startEdge(n.id, e)}
                      onPortMouseUp={() => finishEdgeOn(n.id)}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Inspector */}
          {selectedNode && (
            <div className="absolute right-4 top-4 w-64 rounded-lg border border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {SYMBOLS[selectedNode.kind].name}
                </span>
                <button
                  onClick={deleteSelected}
                  className="text-xs text-destructive hover:underline"
                >
                  Excluir
                </button>
              </div>
              <label className="mb-1 block text-xs font-medium">Texto</label>
              <textarea
                value={selectedNode.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {SYMBOLS[selectedNode.kind].description}
              </p>
            </div>
          )}

          {/* Zoom indicator */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
            <button
              onClick={() => setView({ x: 0, y: 0, k: 1 })}
              className="rounded px-2 py-0.5 hover:bg-muted"
            >
              Resetar vista
            </button>
            <span>·</span>
            <span>{Math.round(view.k * 100)}%</span>
          </div>

          {/* Validation panel */}
          <div className="absolute bottom-4 right-4 w-72 rounded-lg border border-border bg-card/95 p-3 text-xs shadow-lg backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold uppercase tracking-widest text-muted-foreground">Validação</span>
              {validation.length === 0 ? (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  OK
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                  {validation.length} aviso{validation.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {validation.length === 0 ? (
              <p className="text-muted-foreground">Fluxograma íntegro: tem início, fim e todos os símbolos conectados.</p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {validation.map((v, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className={v.level === "error" ? "text-destructive" : "text-amber-600"}>●</span>
                    <span className="text-foreground">{v.msg}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
