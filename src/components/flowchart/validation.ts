import type { FlowDoc } from "./types";

export type Issue = { level: "error" | "warning"; msg: string };

export function validateFlow(doc: FlowDoc): Issue[] {
  const issues: Issue[] = [];
  if (doc.nodes.length === 0) return issues;
  const terms = doc.nodes.filter((n) => n.kind === "terminator");
  const hasStart = terms.some((n) => /in[ií]cio|start|começar/i.test(n.label));
  const hasEnd = terms.some((n) => /fim|end|parar/i.test(n.label));
  if (!hasStart) issues.push({ level: "error", msg: "Falta um símbolo Terminal de Início" });
  if (!hasEnd) issues.push({ level: "error", msg: "Falta um símbolo Terminal de Fim" });

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  doc.nodes.forEach((n) => {
    incoming.set(n.id, 0);
    outgoing.set(n.id, 0);
  });
  doc.edges.forEach((e) => {
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    outgoing.set(e.from, (outgoing.get(e.from) ?? 0) + 1);
  });
  doc.nodes.forEach((n) => {
    const inc = incoming.get(n.id) ?? 0;
    const out = outgoing.get(n.id) ?? 0;
    const isStart = n.kind === "terminator" && /in[ií]cio|start/i.test(n.label);
    const isEnd = n.kind === "terminator" && /fim|end/i.test(n.label);
    if (inc === 0 && out === 0) {
      issues.push({ level: "warning", msg: `"${n.label}" está desconectado` });
    } else if (!isStart && inc === 0) {
      issues.push({ level: "warning", msg: `"${n.label}" não tem entrada` });
    } else if (!isEnd && out === 0) {
      issues.push({ level: "warning", msg: `"${n.label}" não tem saída` });
    }
    if (n.kind === "decision") {
      const labels = doc.edges
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

  // ISO 5807: edges referenciando nós inexistentes
  const ids = new Set(doc.nodes.map((n) => n.id));
  doc.edges.forEach((e) => {
    if (!ids.has(e.from) || !ids.has(e.to)) {
      issues.push({ level: "error", msg: `Conexão inconsistente (${e.from}→${e.to})` });
    }
  });

  return issues;
}
