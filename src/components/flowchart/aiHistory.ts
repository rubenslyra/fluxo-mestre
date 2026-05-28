import type { FlowDoc } from "./types";

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface AiHistoryEntry {
  id: string;
  createdAt: number;
  description: string;
  title: string;
  summary?: string;
  flow: FlowDoc;
}

const TEMPLATES_KEY = "flowchart-ai-templates-v1";
const HISTORY_KEY = "flowchart-ai-history-v1";
const MAX_HISTORY = 20;

const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: "tpl-aop1",
    name: "AOP1 UVV — Decisão simples",
    createdAt: 0,
    description:
      "Ler um número inteiro N. Se N for par, exibir 'Par'; senão, exibir 'Ímpar'. Encerrar.",
  },
  {
    id: "tpl-aop2",
    name: "AOP2 UVV — Médias com recuperação",
    createdAt: 0,
    description:
      "Sistema de avaliação UVVon: ler para 100 alunos as notas AOP1 [0-1], AOP2 [0-2], AOP3 [0-1] e Prova Regular [0-6]. Calcular MM = AOP1+AOP2+AOP3+PR.\n- Se MM < 3.0 → Reprovado direto.\n- Se MM >= 7.0 → Aprovado.\n- Senão (3.0 <= MM < 7.0) → ler nota da Prova de Recuperação [0-10] e calcular Média Geral. Se >= 5.0 → Aprovado, senão → Reprovado.\nAo final, mostrar a porcentagem de aprovados e reprovados.",
  },
  {
    id: "tpl-aop3",
    name: "AOP3 UVV — Laço com contador",
    createdAt: 0,
    description:
      "Ler 50 valores numéricos. Para cada valor, somar a um acumulador e contar quantos são positivos. Ao final, exibir a soma total e a média dos valores positivos.",
  },
];

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in private browsing or restricted environments.
  }
}

export function loadTemplates(): PromptTemplate[] {
  const stored = safeRead<PromptTemplate[] | null>(TEMPLATES_KEY, null);
  if (!stored || stored.length === 0) return DEFAULT_TEMPLATES;
  return stored;
}

export function saveTemplates(list: PromptTemplate[]) {
  safeWrite(TEMPLATES_KEY, list);
}

export function addTemplate(name: string, description: string): PromptTemplate[] {
  const list = loadTemplates();
  const tpl: PromptTemplate = {
    id: "tpl-" + Math.random().toString(36).slice(2, 9),
    name,
    description,
    createdAt: Date.now(),
  };
  const next = [tpl, ...list];
  saveTemplates(next);
  return next;
}

export function removeTemplate(id: string): PromptTemplate[] {
  const next = loadTemplates().filter((t) => t.id !== id);
  saveTemplates(next);
  return next;
}

export function loadHistory(): AiHistoryEntry[] {
  return safeRead<AiHistoryEntry[]>(HISTORY_KEY, []);
}

export function pushHistory(entry: Omit<AiHistoryEntry, "id" | "createdAt">): AiHistoryEntry[] {
  const list = loadHistory();
  const item: AiHistoryEntry = {
    ...entry,
    id: "hist-" + Math.random().toString(36).slice(2, 9),
    createdAt: Date.now(),
  };
  const next = [item, ...list].slice(0, MAX_HISTORY);
  safeWrite(HISTORY_KEY, next);
  return next;
}

export function removeHistory(id: string): AiHistoryEntry[] {
  const next = loadHistory().filter((h) => h.id !== id);
  safeWrite(HISTORY_KEY, next);
  return next;
}

export function clearHistory(): AiHistoryEntry[] {
  safeWrite(HISTORY_KEY, []);
  return [];
}

export interface EdgeKey {
  from: string;
  to: string;
  label?: string;
}

export interface FlowDiff {
  addedNodes: { label: string; kind: string }[];
  removedNodes: { label: string; kind: string }[];
  keptNodes: string[];
  addedEdges: EdgeKey[];
  removedEdges: EdgeKey[];
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function diffFlows(a: FlowDoc, b: FlowDoc): FlowDiff {
  const aNodes = new Map(a.nodes.map((n) => [norm(n.label), n]));
  const bNodes = new Map(b.nodes.map((n) => [norm(n.label), n]));

  const addedNodes: { label: string; kind: string }[] = [];
  const removedNodes: { label: string; kind: string }[] = [];
  const keptNodes: string[] = [];
  bNodes.forEach((n, k) => {
    if (!aNodes.has(k)) addedNodes.push({ label: n.label, kind: n.kind });
    else keptNodes.push(n.label);
  });
  aNodes.forEach((n, k) => {
    if (!bNodes.has(k)) removedNodes.push({ label: n.label, kind: n.kind });
  });

  const labelOf = (doc: FlowDoc, id: string) =>
    norm(doc.nodes.find((n) => n.id === id)?.label ?? id);
  const edgeKey = (doc: FlowDoc, e: { from: string; to: string; label?: string }) =>
    `${labelOf(doc, e.from)}→${labelOf(doc, e.to)}|${norm(e.label ?? "")}`;

  const aEdges = new Map(a.edges.map((e) => [edgeKey(a, e), e]));
  const bEdges = new Map(b.edges.map((e) => [edgeKey(b, e), e]));
  const addedEdges: EdgeKey[] = [];
  const removedEdges: EdgeKey[] = [];
  bEdges.forEach((e, k) => {
    if (!aEdges.has(k))
      addedEdges.push({
        from: b.nodes.find((n) => n.id === e.from)?.label ?? e.from,
        to: b.nodes.find((n) => n.id === e.to)?.label ?? e.to,
        label: e.label,
      });
  });
  aEdges.forEach((e, k) => {
    if (!bEdges.has(k))
      removedEdges.push({
        from: a.nodes.find((n) => n.id === e.from)?.label ?? e.from,
        to: a.nodes.find((n) => n.id === e.to)?.label ?? e.to,
        label: e.label,
      });
  });

  return { addedNodes, removedNodes, keptNodes, addedEdges, removedEdges };
}

export function exportTemplatesJson(): string {
  return JSON.stringify(
    { kind: "flowchart-templates", version: 1, items: loadTemplates() },
    null,
    2,
  );
}

export function importTemplatesJson(raw: string, mode: "merge" | "replace"): PromptTemplate[] {
  const parsed = JSON.parse(raw);
  const items: PromptTemplate[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.items)
      ? parsed.items
      : [];
  const cleaned: PromptTemplate[] = items
    .filter((t) => t && typeof t.name === "string" && typeof t.description === "string")
    .map((t) => ({
      id: typeof t.id === "string" ? t.id : "tpl-" + Math.random().toString(36).slice(2, 9),
      name: t.name,
      description: t.description,
      createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
    }));
  const next =
    mode === "replace"
      ? cleaned
      : (() => {
          const existing = loadTemplates();
          const seen = new Set(existing.map((t) => t.name + "::" + t.description));
          const merged = [...existing];
          cleaned.forEach((t) => {
            const k = t.name + "::" + t.description;
            if (!seen.has(k)) {
              merged.unshift(t);
              seen.add(k);
            }
          });
          return merged;
        })();
  saveTemplates(next);
  return next;
}
