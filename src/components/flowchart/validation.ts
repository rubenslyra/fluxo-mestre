import type { FlowDoc } from "./types";

export type Issue = { level: "error" | "warning"; msg: string };

const START_RE = /in[ií]cio|start|começar/i;
const END_RE = /fim|end|parar/i;

function walkFrom(seeds: string[], adjacency: Map<string, string[]>) {
  const seen = new Set<string>();
  const stack = [...seeds];

  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const next of adjacency.get(id) ?? []) {
      if (!seen.has(next)) stack.push(next);
    }
  }

  return seen;
}

function normalizedEdgeLabel(label: string | undefined) {
  return label?.trim().toLowerCase() || "";
}

export function validateFlow(doc: FlowDoc): Issue[] {
  const issues: Issue[] = [];
  if (doc.nodes.length === 0) return issues;
  const terms = doc.nodes.filter((n) => n.kind === "terminator");
  const startIds = terms.filter((n) => START_RE.test(n.label)).map((n) => n.id);
  const endIds = terms.filter((n) => END_RE.test(n.label)).map((n) => n.id);
  const hasStart = startIds.length > 0;
  const hasEnd = endIds.length > 0;
  if (!hasStart) issues.push({ level: "error", msg: "Falta um símbolo Terminal de Início" });
  if (!hasEnd) issues.push({ level: "error", msg: "Falta um símbolo Terminal de Fim" });

  const ids = new Set(doc.nodes.map((n) => n.id));
  const validEdges = doc.edges.filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);
  const invalidEdges = doc.edges.filter(
    (e) => !ids.has(e.from) || !ids.has(e.to) || e.from === e.to,
  );
  invalidEdges.forEach((e) => {
    issues.push({ level: "error", msg: `Conexão inconsistente (${e.from}→${e.to})` });
  });

  const seenEdges = new Set<string>();
  validEdges.forEach((e) => {
    const key = `${e.from}\0${e.to}\0${normalizedEdgeLabel(e.label)}`;
    if (seenEdges.has(key)) {
      issues.push({ level: "warning", msg: `Conexão duplicada (${e.from}→${e.to})` });
    }
    seenEdges.add(key);
  });

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const reverseAdjacency = new Map<string, string[]>();
  doc.nodes.forEach((n) => {
    incoming.set(n.id, 0);
    outgoing.set(n.id, 0);
    adjacency.set(n.id, []);
    reverseAdjacency.set(n.id, []);
  });
  validEdges.forEach((e) => {
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    outgoing.set(e.from, (outgoing.get(e.from) ?? 0) + 1);
    adjacency.get(e.from)!.push(e.to);
    reverseAdjacency.get(e.to)!.push(e.from);
  });

  const locallyBroken = new Set<string>();
  doc.nodes.forEach((n) => {
    const inc = incoming.get(n.id) ?? 0;
    const out = outgoing.get(n.id) ?? 0;
    const isStart = n.kind === "terminator" && START_RE.test(n.label);
    const isEnd = n.kind === "terminator" && END_RE.test(n.label);
    if (inc === 0 && out === 0) {
      issues.push({ level: "warning", msg: `"${n.label}" está desconectado` });
      locallyBroken.add(n.id);
    } else if (!isStart && inc === 0) {
      issues.push({ level: "warning", msg: `"${n.label}" não tem entrada` });
      locallyBroken.add(n.id);
    } else if (!isEnd && out === 0) {
      issues.push({ level: "warning", msg: `"${n.label}" não tem saída` });
      locallyBroken.add(n.id);
    }
    if (n.kind === "decision") {
      const labels = validEdges
        .filter((e) => e.from === n.id)
        .map((e) => (e.label ?? "").trim().toLowerCase());
      if (labels.length < 2) {
        issues.push({
          level: "warning",
          msg: `Decisão "${n.label}" deveria ter 2 saídas (Sim/Não)`,
        });
      } else {
        const hasYes = labels.some((l) => /^(s|sim|yes|y|true|verdadeiro)$/i.test(l));
        const hasNo = labels.some((l) => /^(n|não|nao|no|false|falso)$/i.test(l));
        if (!hasYes || !hasNo) {
          issues.push({
            level: "warning",
            msg: `Decisão "${n.label}" sem rótulos Sim/Não nas saídas`,
          });
        }
      }
    }
  });

  if (hasStart) {
    const reachable = walkFrom(startIds, adjacency);
    doc.nodes.forEach((n) => {
      if (!reachable.has(n.id) && !locallyBroken.has(n.id)) {
        issues.push({
          level: "warning",
          msg: `"${n.label}" não é alcançado a partir do Início`,
        });
      }
    });
  }

  if (hasEnd) {
    const converges = walkFrom(endIds, reverseAdjacency);
    doc.nodes.forEach((n) => {
      if (!converges.has(n.id) && !locallyBroken.has(n.id)) {
        issues.push({ level: "warning", msg: `"${n.label}" não converge para Fim` });
      }
    });
  }

  return issues;
}
