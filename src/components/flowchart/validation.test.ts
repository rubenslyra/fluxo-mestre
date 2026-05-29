import { describe, expect, test } from "bun:test";
import type { FlowDoc, FlowEdge, FlowNode } from "./types";
import { validateFlow } from "./validation";

function node(init: Partial<FlowNode> & Pick<FlowNode, "id" | "label">): FlowNode {
  return {
    id: init.id,
    kind: init.kind ?? "process",
    x: init.x ?? 0,
    y: init.y ?? 0,
    w: init.w ?? 160,
    h: init.h ?? 70,
    label: init.label,
  };
}

function edge(from: string, to: string, label?: string): FlowEdge {
  return { id: `${from}-${to}-${label ?? "main"}`, from, to, label };
}

function messages(doc: FlowDoc) {
  return validateFlow(doc).map((issue) => issue.msg);
}

describe("validateFlow", () => {
  test("accepts a connected flow that starts and converges to the end", () => {
    const doc: FlowDoc = {
      nodes: [
        node({ id: "start", kind: "terminator", label: "Inicio" }),
        node({ id: "input", kind: "data", label: "Ler dados" }),
        node({ id: "end", kind: "terminator", label: "Fim" }),
      ],
      edges: [edge("start", "input"), edge("input", "end")],
    };

    expect(validateFlow(doc)).toEqual([]);
  });

  test("does not let invalid edges mask missing local connections", () => {
    const doc: FlowDoc = {
      nodes: [
        node({ id: "start", kind: "terminator", label: "Inicio" }),
        node({ id: "step", label: "Processar" }),
        node({ id: "end", kind: "terminator", label: "Fim" }),
      ],
      edges: [edge("start", "step"), edge("step", "missing")],
    };

    expect(messages(doc)).toContain("Conexão inconsistente (step→missing)");
    expect(messages(doc)).toContain('"Processar" não tem saída');
    expect(messages(doc)).toContain('"Fim" está desconectado');
  });

  test("detects connected islands that are unreachable and do not converge", () => {
    const doc: FlowDoc = {
      nodes: [
        node({ id: "start", kind: "terminator", label: "Inicio" }),
        node({ id: "end", kind: "terminator", label: "Fim" }),
        node({ id: "a", label: "Ilha A" }),
        node({ id: "b", label: "Ilha B" }),
      ],
      edges: [edge("start", "end"), edge("a", "b"), edge("b", "a")],
    };

    const result = messages(doc);
    expect(result).toContain('"Ilha A" não é alcançado a partir do Início');
    expect(result).toContain('"Ilha B" não é alcançado a partir do Início');
    expect(result).toContain('"Ilha A" não converge para Fim');
    expect(result).toContain('"Ilha B" não converge para Fim');
  });

  test("requires two labelled outcomes for decisions", () => {
    const doc: FlowDoc = {
      nodes: [
        node({ id: "start", kind: "terminator", label: "Inicio" }),
        node({ id: "check", kind: "decision", label: "Nota valida?" }),
        node({ id: "ok", label: "Salvar" }),
        node({ id: "end", kind: "terminator", label: "Fim" }),
      ],
      edges: [edge("start", "check"), edge("check", "ok", "Talvez"), edge("ok", "end")],
    };

    expect(messages(doc)).toContain('Decisão "Nota valida?" deveria ter 2 saídas (Sim/Não)');
  });

  test("flags duplicate connections", () => {
    const doc: FlowDoc = {
      nodes: [
        node({ id: "start", kind: "terminator", label: "Inicio" }),
        node({ id: "end", kind: "terminator", label: "Fim" }),
      ],
      edges: [edge("start", "end"), { ...edge("start", "end"), id: "duplicate" }],
    };

    expect(messages(doc)).toContain("Conexão duplicada (start→end)");
  });
});
