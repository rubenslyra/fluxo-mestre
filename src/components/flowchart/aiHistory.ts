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
  } catch {}
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

export interface FlowDiff {
  addedNodes: number;
  removedNodes: number;
  addedEdges: number;
  removedEdges: number;
  labelChanges: number;
}

export function diffFlows(a: FlowDoc, b: FlowDoc): FlowDiff {
  const aLabels = new Map(a.nodes.map((n) => [n.label.trim().toLowerCase(), n]));
  const bLabels = new Map(b.nodes.map((n) => [n.label.trim().toLowerCase(), n]));
  let added = 0;
  let removed = 0;
  let labelChanges = 0;
  bLabels.forEach((_n, k) => {
    if (!aLabels.has(k)) added++;
  });
  aLabels.forEach((_n, k) => {
    if (!bLabels.has(k)) removed++;
  });
  // edge counts
  const ae = a.edges.length;
  const be = b.edges.length;
  return {
    addedNodes: added,
    removedNodes: removed,
    addedEdges: Math.max(0, be - ae),
    removedEdges: Math.max(0, ae - be),
    labelChanges,
  };
}
