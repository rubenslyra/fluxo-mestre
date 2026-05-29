import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Code2, MonitorSmartphone } from "lucide-react";
import {
  APP_SETTINGS_CHANGED_EVENT,
  defaultAppSettings,
  loadAppSettings,
} from "../settings/appSettings";
import { SYMBOLS, type SymbolKind } from "./symbols";
import { SymbolPreview, NodeShape } from "./NodeShape";
import { edgePath } from "./geometry";
import {
  canConnectFlowNodes,
  connectFlowNodes,
  findTopNodeAtPoint,
  moveNodesTo,
  nodeIntersectsSelection,
  normalizeSelectionBox,
  type SelectionBox,
} from "./flowModel";
import type { FlowDoc, FlowNode } from "./types";
import { AiGeneratorPanel } from "./AiGeneratorPanel";
import { CodeGeneratorPanel } from "./CodeGeneratorPanel";
import { validateFlow } from "./validation";
import { downloadPdf, downloadPng, downloadSvg } from "./exportImage";

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
    if (raw) return normalizeDoc(JSON.parse(raw));
  } catch {
    // Ignore invalid or unavailable local storage data.
  }
  return initialDoc;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function cloneDoc(doc: FlowDoc): FlowDoc {
  return {
    nodes: doc.nodes.map((node) => ({ ...node })),
    edges: doc.edges.map((edge) => ({ ...edge })),
  };
}

function normalizeDoc(value: unknown): FlowDoc {
  if (!value || typeof value !== "object") return cloneDoc(initialDoc);
  const maybeDoc = value as Partial<FlowDoc>;
  if (!Array.isArray(maybeDoc.nodes) || !Array.isArray(maybeDoc.edges)) return cloneDoc(initialDoc);

  const seenNodes = new Set<string>();
  const nodes: FlowNode[] = maybeDoc.nodes.flatMap((node, index) => {
    if (!node || typeof node !== "object") return [];
    const partial = node as Partial<FlowNode>;
    const kind = partial.kind && partial.kind in SYMBOLS ? partial.kind : "process";
    const def = SYMBOLS[kind];
    const id = String(partial.id || `n${index + 1}`);
    if (seenNodes.has(id)) return [];
    seenNodes.add(id);
    return [
      {
        id,
        kind,
        x: Number.isFinite(partial.x) ? Number(partial.x) : 400,
        y: Number.isFinite(partial.y) ? Number(partial.y) : 80 + index * 120,
        w:
          Number.isFinite(partial.w) && Number(partial.w) > 0
            ? Number(partial.w)
            : def.defaultWidth,
        h:
          Number.isFinite(partial.h) && Number(partial.h) > 0
            ? Number(partial.h)
            : def.defaultHeight,
        label: typeof partial.label === "string" ? partial.label : def.defaultLabel,
      },
    ];
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const seenEdges = new Set<string>();
  const edges = maybeDoc.edges.flatMap((edge, index) => {
    if (!edge || typeof edge !== "object") return [];
    const partial = edge as Partial<FlowDoc["edges"][number]>;
    const from = typeof partial.from === "string" ? partial.from : "";
    const to = typeof partial.to === "string" ? partial.to : "";
    if (!nodeIds.has(from) || !nodeIds.has(to) || from === to) return [];
    const id = String(partial.id || `e${index + 1}`);
    if (seenEdges.has(id)) return [];
    seenEdges.add(id);
    return [
      {
        id,
        from,
        to,
        label: typeof partial.label === "string" && partial.label ? partial.label : undefined,
      },
    ];
  });

  return { nodes, edges };
}

const EXPORT_PREFS_KEY = "flowchart-export-prefs-v1";
type ExportFormat = "png" | "svg" | "pdf";
type PendingEdge = { from: string; x: number; y: number };

function loadExportPrefs(): { format: ExportFormat; scale: number } {
  if (typeof window === "undefined") return { format: "png", scale: 2 };
  try {
    const raw = localStorage.getItem(EXPORT_PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const scale = Math.max(1, Math.min(4, Number(p.scale) || 2));
      const format: ExportFormat = p.format === "svg" || p.format === "pdf" ? p.format : "png";
      return { format, scale };
    }
  } catch {
    // Ignore invalid or unavailable local storage data.
  }
  return { format: "png", scale: 2 };
}

export function FlowchartEditor() {
  const [storageReady, setStorageReady] = useState(false);
  const [doc, setDocRaw] = useState<FlowDoc>(() => cloneDoc(initialDoc));
  const [past, setPast] = useState<FlowDoc[]>([]);
  const [future, setFuture] = useState<FlowDoc[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [pendingEdge, setPendingEdge] = useState<PendingEdge | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [exportMenu, setExportMenu] = useState(false);
  const [exportScale, setExportScale] = useState(2);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [showMobileEditor, setShowMobileEditor] = useState(false);
  const [confirmBeforeClear, setConfirmBeforeClear] = useState(
    defaultAppSettings.ui.confirmBeforeClear,
  );

  useEffect(() => {
    setDocRaw(loadDoc());
    const prefs = loadExportPrefs();
    setExportScale(prefs.scale);
    setExportFormat(prefs.format);
    setStorageReady(true);
  }, []);

  useEffect(() => {
    const syncSettings = () => setConfirmBeforeClear(loadAppSettings().ui.confirmBeforeClear);
    syncSettings();
    window.addEventListener(APP_SETTINGS_CHANGED_EVENT, syncSettings);
    return () => window.removeEventListener(APP_SETTINGS_CHANGED_EVENT, syncSettings);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(
        EXPORT_PREFS_KEY,
        JSON.stringify({ format: exportFormat, scale: exportScale }),
      );
    } catch {
      // Ignore storage failures in private browsing or restricted environments.
    }
  }, [exportFormat, exportScale, storageReady]);
  const svgRef = useRef<SVGSVGElement>(null);
  const inspectorTextRef = useRef<HTMLTextAreaElement>(null);
  const edgeLabelRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    ids: string[];
    startWorldX: number;
    startWorldY: number;
    initialNodes: Array<{ id: string; x: number; y: number }>;
    startClientX: number;
    startClientY: number;
    committed: boolean;
  } | null>(null);
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const selectionBoxRef = useRef<SelectionBox | null>(null);
  const pendingEdgeRef = useRef<PendingEdge | null>(null);
  const docRef = useRef(doc);
  const viewRef = useRef(view);
  docRef.current = doc;
  viewRef.current = view;

  // Snapshot current doc into the undo stack and clear redo
  const commit = useCallback(() => {
    setPast((p) => [...p.slice(-49), cloneDoc(docRef.current)]);
    setFuture([]);
  }, []);

  // setDoc that also commits the previous state to history
  type DocUpdater = FlowDoc | ((d: FlowDoc) => FlowDoc);
  const setDoc = useCallback(
    (updater: DocUpdater) => {
      commit();
      setDocRaw((d) =>
        typeof updater === "function" ? (updater as (d: FlowDoc) => FlowDoc)(d) : updater,
      );
    },
    [commit],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = cloneDoc(p[p.length - 1]);
      setFuture((f) => [cloneDoc(docRef.current), ...f].slice(0, 50));
      setDocRaw(prev);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = cloneDoc(f[0]);
      setPast((p) => [...p.slice(-49), cloneDoc(docRef.current)]);
      setDocRaw(next);
      return f.slice(1);
    });
  }, []);

  const matchedIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return new Set(doc.nodes.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id));
  }, [search, doc.nodes]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectionPreviewIdSet = useMemo(() => {
    if (!selectionBox) return null;
    const rect = normalizeSelectionBox(selectionBox);
    return new Set(
      doc.nodes.filter((node) => nodeIntersectsSelection(node, rect)).map((node) => node.id),
    );
  }, [doc.nodes, selectionBox]);

  const selectNodes = useCallback((ids: string[]) => {
    const uniqueIds = [...new Set(ids)];
    setSelectedIds(uniqueIds);
    setSelected(uniqueIds.length === 1 ? uniqueIds[0] : null);
    setSelectedEdge(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setSelectedIds([]);
    setSelectedEdge(null);
  }, []);

  const applyAiDoc = (incoming: FlowDoc, mode: "replace" | "merge") => {
    if (mode === "replace") {
      setDoc(normalizeDoc(incoming));
      return;
    }
    // merge: prefixar ids para evitar colisão
    const normalizedIncoming = normalizeDoc(incoming);
    const prefix = "ai_" + Math.random().toString(36).slice(2, 6) + "_";
    const remap = new Map<string, string>();
    normalizedIncoming.nodes.forEach((n) => remap.set(n.id, prefix + n.id));
    const offsetX = 0;
    const offsetY = (Math.max(0, ...doc.nodes.map((n) => n.y + n.h / 2)) || 0) + 80;
    const newNodes = normalizedIncoming.nodes.map((n) => ({
      ...n,
      id: remap.get(n.id)!,
      x: n.x + offsetX,
      y: n.y + offsetY,
    }));
    const newEdges = normalizedIncoming.edges.map((e) => ({
      ...e,
      id: prefix + e.id,
      from: remap.get(e.from)!,
      to: remap.get(e.to)!,
    }));
    setDoc((d) => ({ nodes: [...d.nodes, ...newNodes], edges: [...d.edges, ...newEdges] }));
  };

  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch {
      // Ignore storage failures in private browsing or restricted environments.
    }
  }, [doc, storageReady]);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const currentView = viewRef.current;
    return {
      x: (sx - rect.left - currentView.x) / currentView.k,
      y: (sy - rect.top - currentView.y) / currentView.k,
    };
  }, []);

  const setActivePendingEdge = useCallback((edge: PendingEdge | null) => {
    pendingEdgeRef.current = edge;
    setPendingEdge(edge);
  }, []);

  const updatePendingEdgePoint = useCallback(
    (clientX: number, clientY: number) => {
      const pending = pendingEdgeRef.current;
      if (!pending) return;
      const w = screenToWorld(clientX, clientY);
      setActivePendingEdge({ ...pending, x: w.x, y: w.y });
    },
    [screenToWorld, setActivePendingEdge],
  );

  const finishPendingEdgeOn = useCallback(
    (toId: string) => {
      const pending = pendingEdgeRef.current;
      if (!pending) return;
      if (canConnectFlowNodes(docRef.current, { from: pending.from, to: toId })) {
        setDoc((d) => connectFlowNodes(d, { id: uid(), from: pending.from, to: toId }));
      }
      setActivePendingEdge(null);
    },
    [setDoc, setActivePendingEdge],
  );

  const finishPendingEdgeAt = useCallback(
    (clientX?: number, clientY?: number) => {
      const pending = pendingEdgeRef.current;
      if (!pending) return;

      if (typeof clientX === "number" && typeof clientY === "number") {
        const target = findTopNodeAtPoint(docRef.current.nodes, screenToWorld(clientX, clientY), {
          excludeId: pending.from,
        });

        if (target && canConnectFlowNodes(docRef.current, { from: pending.from, to: target.id })) {
          setDoc((d) => connectFlowNodes(d, { id: uid(), from: pending.from, to: target.id }));
        }
      }

      setActivePendingEdge(null);
    },
    [screenToWorld, setDoc, setActivePendingEdge],
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
    selectNodes([node.id]);
  };

  // updates that happen continuously (drag, typing) — bypass history; caller commits once at the start
  const updateNode = useCallback((id: string, patch: Partial<FlowNode>) => {
    setDocRaw((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  }, []);

  const updateNodes = useCallback((positions: Array<{ id: string; x: number; y: number }>) => {
    setDocRaw((d) => moveNodesTo(d, positions));
  }, []);

  const setActiveSelectionBox = useCallback((box: SelectionBox | null) => {
    selectionBoxRef.current = box;
    setSelectionBox(box);
  }, []);

  const startSelectionBox = useCallback(
    (clientX: number, clientY: number) => {
      const w = screenToWorld(clientX, clientY);
      clearSelection();
      setActiveSelectionBox({ startX: w.x, startY: w.y, x: w.x, y: w.y });
    },
    [clearSelection, screenToWorld, setActiveSelectionBox],
  );

  const updateSelectionBox = useCallback(
    (clientX: number, clientY: number) => {
      const box = selectionBoxRef.current;
      if (!box) return;
      const w = screenToWorld(clientX, clientY);
      setActiveSelectionBox({ ...box, x: w.x, y: w.y });
    },
    [screenToWorld, setActiveSelectionBox],
  );

  const findNodesInSelection = useCallback((box: SelectionBox) => {
    const rect = normalizeSelectionBox(box);
    if (Math.max(rect.w, rect.h) < 4) {
      const point = { x: box.x, y: box.y };
      const node = findTopNodeAtPoint(docRef.current.nodes, point);
      return node ? [node] : [];
    }
    return docRef.current.nodes.filter((node) => nodeIntersectsSelection(node, rect));
  }, []);

  const finishSelectionBox = useCallback(
    (clientX?: number, clientY?: number) => {
      let box = selectionBoxRef.current;
      if (!box) return;
      if (typeof clientX === "number" && typeof clientY === "number") {
        const w = screenToWorld(clientX, clientY);
        box = { ...box, x: w.x, y: w.y };
      }
      const targets = findNodesInSelection(box);
      selectNodes(targets.map((node) => node.id));
      setActiveSelectionBox(null);
    },
    [findNodesInSelection, screenToWorld, selectNodes, setActiveSelectionBox],
  );

  const deleteSelected = () => {
    if (selectedIds.length > 0) {
      const idsToDelete = new Set(selectedIds);
      setDoc((d) => ({
        nodes: d.nodes.filter((n) => !idsToDelete.has(n.id)),
        edges: d.edges.filter((e) => !idsToDelete.has(e.from) && !idsToDelete.has(e.to)),
      }));
      clearSelection();
      return;
    }

    if (selectedEdge) {
      setDoc((d) => ({
        ...d,
        edges: d.edges.filter((e) => e.id !== selectedEdge),
      }));
      clearSelection();
    }
  };

  const handleNodeMouseDown = (node: FlowNode, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (e.shiftKey) {
      e.preventDefault();
      startSelectionBox(e.clientX, e.clientY);
      return;
    }
    const idsToDrag = selectedIdSet.has(node.id) ? selectedIds : [node.id];
    if (!selectedIdSet.has(node.id)) selectNodes([node.id]);
    const w = screenToWorld(e.clientX, e.clientY);
    const idsToDragSet = new Set(idsToDrag);
    dragRef.current = {
      ids: idsToDrag,
      startWorldX: w.x,
      startWorldY: w.y,
      initialNodes: docRef.current.nodes
        .filter((currentNode) => idsToDragSet.has(currentNode.id))
        .map((currentNode) => ({ id: currentNode.id, x: currentNode.x, y: currentNode.y })),
      startClientX: e.clientX,
      startClientY: e.clientY,
      committed: false,
    };
  };

  const moveDraggedNode = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      if (!drag.committed) {
        const distance = Math.hypot(clientX - drag.startClientX, clientY - drag.startClientY);
        if (distance < 4) return;
        commit();
        drag.committed = true;
      }
      const w = screenToWorld(clientX, clientY);
      const dx = w.x - drag.startWorldX;
      const dy = w.y - drag.startWorldY;
      updateNodes(
        drag.initialNodes.map((node) => ({
          id: node.id,
          x: Math.round((node.x + dx) / 8) * 8,
          y: Math.round((node.y + dy) / 8) * 8,
        })),
      );
    },
    [commit, screenToWorld, updateNodes],
  );

  const handleMouseUp = useCallback(
    (clientX?: number, clientY?: number) => {
      if (selectionBoxRef.current) {
        finishSelectionBox(clientX, clientY);
        return;
      }
      finishPendingEdgeAt(clientX, clientY);
      dragRef.current = null;
      panRef.current = null;
    },
    [finishPendingEdgeAt, finishSelectionBox],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (selectionBoxRef.current) {
        updateSelectionBox(e.clientX, e.clientY);
        return;
      }
      if (dragRef.current) {
        moveDraggedNode(e.clientX, e.clientY);
        return;
      }
      if (pendingEdgeRef.current) {
        updatePendingEdgePoint(e.clientX, e.clientY);
        return;
      }
      if (panRef.current) {
        const pan = panRef.current;
        setView((v) => ({
          ...v,
          x: pan.vx + (e.clientX - pan.x),
          y: pan.vy + (e.clientY - pan.y),
        }));
      }
    };
    const onMouseUp = (e: MouseEvent) => handleMouseUp(e.clientX, e.clientY);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleMouseUp, moveDraggedNode, updatePendingEdgePoint, updateSelectionBox]);

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      e.preventDefault();
      startSelectionBox(e.clientX, e.clientY);
      return;
    }
    clearSelection();
    panRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  };

  const startEdge = (fromId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey) {
      startSelectionBox(e.clientX, e.clientY);
      return;
    }
    const w = screenToWorld(e.clientX, e.clientY);
    clearSelection();
    setActivePendingEdge({ from: fromId, x: w.x, y: w.y });
  };

  const finishEdgeOn = (toId: string) => {
    finishPendingEdgeOn(toId);
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
      const target = e.target as HTMLElement;
      const inField = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === "z" || e.key === "Z")) {
        if (inField) return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && (e.key === "y" || e.key === "Y")) {
        if (inField) return;
        e.preventDefault();
        redo();
        return;
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        (selectedIds.length > 0 || selectedEdge)
      ) {
        if (inField) return;
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const focusLabelEditor = (nodeId: string) => {
    selectNodes([nodeId]);
    window.requestAnimationFrame(() => {
      inspectorTextRef.current?.focus();
      inspectorTextRef.current?.select();
    });
  };

  const focusEdgeLabelEditor = (edgeId: string) => {
    setSelected(null);
    setSelectedIds([]);
    setSelectedEdge(edgeId);
    window.requestAnimationFrame(() => {
      edgeLabelRef.current?.focus();
      edgeLabelRef.current?.select();
    });
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

  const exportPDF = async () => {
    if (doc.nodes.length === 0) return;
    await downloadPdf(doc, getInner());
  };

  const runSelectedExport = () => {
    if (exportFormat === "png") void exportPNG(exportScale);
    else if (exportFormat === "pdf") void exportPDF();
    else exportSVG();
  };

  const exportFormatLabel =
    exportFormat === "png" ? `PNG ${exportScale}x` : exportFormat.toUpperCase();

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
        setDoc(normalizeDoc(JSON.parse(String(reader.result))));
        clearSelection();
      } catch {
        alert("Arquivo inválido");
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (!confirmBeforeClear || confirm("Limpar todo o fluxograma?")) {
      setDoc({ nodes: [], edges: [] });
      clearSelection();
    }
  };

  const loadExample = () => {
    setDoc(initialDoc);
    clearSelection();
  };

  const selectedNode = doc.nodes.find((n) => n.id === selected) ?? null;
  const selectedNodeCount = selectedIds.length;
  const selectedEdgeData = doc.edges.find((e) => e.id === selectedEdge) ?? null;

  const validation = validateFlow(doc);

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      {/* Top bar */}
      <header
        className={`${showMobileEditor ? "flex" : "hidden"} shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:flex`}
      >
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight">FluxoLab</h1>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            ISO 5807 · Lógica & Algoritmos
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 flex overflow-hidden rounded-md border border-border">
            <button
              onClick={undo}
              disabled={past.length === 0}
              title="Desfazer (Ctrl+Z)"
              className="px-2 py-1.5 text-sm hover:bg-muted disabled:opacity-30"
            >
              ↶ Desfazer
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              title="Refazer (Ctrl+Shift+Z / Ctrl+Y)"
              className="border-l border-border px-2 py-1.5 text-sm hover:bg-muted disabled:opacity-30"
            >
              ↷ Refazer
            </button>
          </div>
          <button
            onClick={() => setAiOpen(true)}
            className="rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            title="Gerar fluxograma a partir de descrição com IA"
          >
            🤖 Gerar com IA
          </button>
          <button
            onClick={() => setCodeOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            title="Gerar código a partir do fluxograma"
          >
            <Code2 aria-hidden className="size-4" />
            Gerar código
          </button>
          <button
            onClick={loadExample}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
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
          <button
            onClick={exportJSON}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Exportar JSON
          </button>
          <div className="relative">
            <div className="flex overflow-hidden rounded-md">
              <button
                onClick={runSelectedExport}
                className="bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                title="Repete a última escolha de exportação"
              >
                Exportar {exportFormatLabel}
              </button>
              <button
                onClick={() => setExportMenu((v) => !v)}
                className="border-l border-primary-foreground/20 bg-primary px-2 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                title="Opções de exportação"
              >
                ▾
              </button>
            </div>
            {exportMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-card p-3 text-sm shadow-xl">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Formato
                </p>
                <div className="mb-3 flex gap-1">
                  {(["png", "svg", "pdf"] as ExportFormat[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setExportFormat(f)}
                      className={`flex-1 rounded border px-2 py-1 text-xs uppercase ${
                        exportFormat === f
                          ? "border-primary bg-primary/10 font-semibold text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {exportFormat === "png" && (
                  <>
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
                  </>
                )}
                {exportFormat === "pdf" && (
                  <p className="mb-3 rounded border border-border bg-muted/50 p-2 text-[11px] text-muted-foreground">
                    PDF em A4 paisagem, com margem e divisão automática em páginas.
                  </p>
                )}
                <button
                  onClick={() => {
                    setExportMenu(false);
                    runSelectedExport();
                  }}
                  className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Baixar {exportFormatLabel}
                </button>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Sua escolha fica salva entre sessões.
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <AiGeneratorPanel open={aiOpen} onClose={() => setAiOpen(false)} onApply={applyAiDoc} />
      <CodeGeneratorPanel doc={doc} open={codeOpen} onClose={() => setCodeOpen(false)} />

      {!showMobileEditor && (
        <section className="flex min-h-0 w-screen max-w-full flex-1 items-center justify-center overflow-hidden bg-canvas px-5 py-8 md:hidden">
          <div className="w-[min(18rem,calc(100vw-2.5rem))] rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MonitorSmartphone aria-hidden className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">FluxoLab</h2>
                <p className="text-xs text-muted-foreground">ISO 5807 para lógica e algoritmos</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              O editor é mais produtivo em tablet, desktop ou telas maiores. No celular, use esta
              entrada para conhecer o projeto e retome a criação completa em uma tela ampla.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <span className="rounded-md border border-border bg-background px-3 py-2">
                Tema claro/escuro
              </span>
              <span className="rounded-md border border-border bg-background px-3 py-2">
                IA local ou API
              </span>
              <span className="rounded-md border border-border bg-background px-3 py-2">
                Exportação PNG/PDF
              </span>
              <span className="rounded-md border border-border bg-background px-3 py-2">
                Código por blueprint
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowMobileEditor(true)}
              className="mt-5 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Abrir editor mesmo assim
            </button>
          </div>
        </section>
      )}

      <div
        className={`${showMobileEditor ? "flex" : "hidden"} min-h-0 flex-1 overflow-hidden md:flex`}
      >
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
              <li>Shift + arrastar: selecionar por área</li>
              <li>Duplo-clique foca a edição no painel</li>
              <li>Clique numa seta para editar ou remover</li>
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
        <main className="relative min-w-0 flex-1 overflow-hidden bg-canvas">
          <div className="bg-grid absolute inset-0" />
          <svg
            ref={svgRef}
            className="relative h-full w-full"
            onMouseDown={handleSvgMouseDown}
            onMouseUp={(e) => handleMouseUp(e.clientX, e.clientY)}
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
                const edgeSelected = selectedEdge === e.id;
                return (
                  <g key={e.id}>
                    <path
                      d={d}
                      fill="none"
                      stroke={edgeSelected ? "var(--color-node-selected)" : "var(--color-edge)"}
                      strokeWidth={edgeSelected ? 3 : 2}
                      markerEnd="url(#arrow)"
                    />
                    {e.label && (
                      <g transform={`translate(${mid.x}, ${mid.y})`}>
                        <rect
                          x={-18}
                          y={-10}
                          width={36}
                          height={18}
                          rx={4}
                          fill="var(--color-card)"
                          stroke={
                            edgeSelected ? "var(--color-node-selected)" : "var(--color-border)"
                          }
                        />
                        <text
                          textAnchor="middle"
                          y={4}
                          fontSize={11}
                          fill="var(--color-foreground)"
                        >
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
                        setSelected(null);
                        setSelectedIds([]);
                        setSelectedEdge(e.id);
                      }}
                      onDoubleClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        focusEdgeLabelEditor(e.id);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </g>
                );
              })}

              {/* pending edge */}
              {pendingEdge &&
                (() => {
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
                      selected={
                        selectedIdSet.has(n.id) ||
                        (selectionPreviewIdSet?.has(n.id) ?? false) ||
                        (matchedIds?.has(n.id) ?? false)
                      }
                      onMouseDown={(e) => handleNodeMouseDown(n, e)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        focusLabelEditor(n.id);
                      }}
                      onPortMouseDown={(_, e) => startEdge(n.id, e)}
                      onPortMouseUp={() => finishEdgeOn(n.id)}
                    />
                  </g>
                );
              })}

              {selectionBox &&
                (() => {
                  const rect = normalizeSelectionBox(selectionBox);
                  return (
                    <rect
                      x={rect.x}
                      y={rect.y}
                      width={rect.w}
                      height={rect.h}
                      fill="var(--color-accent)"
                      fillOpacity={0.08}
                      stroke="var(--color-node-selected)"
                      strokeWidth={1.5}
                      strokeDasharray="6 4"
                      pointerEvents="none"
                    />
                  );
                })()}
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
                ref={inspectorTextRef}
                value={selectedNode.label}
                onFocus={() => commit()}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {SYMBOLS[selectedNode.kind].description}
              </p>
            </div>
          )}

          {selectedNodeCount > 1 && (
            <div className="absolute right-4 top-4 w-64 rounded-lg border border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Seleção
                </span>
                <button
                  onClick={deleteSelected}
                  className="text-xs text-destructive hover:underline"
                >
                  Excluir
                </button>
              </div>
              <p className="text-sm font-medium">{selectedNodeCount} símbolos selecionados</p>
            </div>
          )}

          {selectedEdgeData && (
            <div className="absolute right-4 top-4 w-64 rounded-lg border border-border bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Conexão
                </span>
                <button
                  onClick={deleteSelected}
                  className="text-xs text-destructive hover:underline"
                >
                  Excluir
                </button>
              </div>
              <label className="mb-1 block text-xs font-medium">Rótulo</label>
              <input
                ref={edgeLabelRef}
                value={selectedEdgeData.label ?? ""}
                onFocus={() => commit()}
                onChange={(e) => {
                  const label = e.target.value;
                  setDocRaw((d) => ({
                    ...d,
                    edges: d.edges.map((edge) =>
                      edge.id === selectedEdgeData.id
                        ? { ...edge, label: label || undefined }
                        : edge,
                    ),
                  }));
                }}
                placeholder="Ex: Sim, Não"
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Use o rótulo para indicar saídas de decisão ou condições de fluxo.
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
          <div className="absolute bottom-3 right-3 max-h-[min(18rem,calc(100%-1.5rem))] w-[min(18rem,calc(100%-1.5rem))] overflow-y-auto rounded-lg border border-border bg-card/95 p-3 text-xs shadow-lg backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold uppercase tracking-widest text-muted-foreground">
                Validação
              </span>
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
              <p className="text-muted-foreground">
                Fluxograma íntegro: tem início, fim e todos os símbolos conectados.
              </p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {validation.map((v, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className={v.level === "error" ? "text-destructive" : "text-amber-600"}>
                      ●
                    </span>
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
