import { describe, expect, test } from "bun:test";
import { CODE_BLUEPRINTS, CODE_LANGUAGES, generateCode } from "./codeBlueprints";
import type { FlowDoc, FlowEdge, FlowNode } from "./types";

type NodeInit = Pick<FlowNode, "id" | "kind" | "label"> &
  Partial<Omit<FlowNode, "id" | "kind" | "label">>;

function node(init: NodeInit): FlowNode {
  return {
    x: 0,
    y: 0,
    w: 160,
    h: 70,
    ...init,
  };
}

function edge(from: string, to: string, label?: string): FlowEdge {
  return {
    id: `${from}-${to}-${label ?? "main"}`,
    from,
    to,
    label,
  };
}

function doc(nodes: FlowNode[], edges: FlowEdge[] = []): FlowDoc {
  return { nodes, edges };
}

const linearDoc = doc(
  [
    node({ id: "start", kind: "terminator", label: "Início", w: 140, h: 60 }),
    node({ id: "input", kind: "data", label: "Ler dados", y: 90 }),
    node({ id: "process", kind: "process", label: "Calcular total", y: 180 }),
    node({ id: "end", kind: "terminator", label: "Fim", y: 270, w: 140, h: 60 }),
  ],
  [edge("start", "input"), edge("input", "process"), edge("process", "end")],
);

const decisionDoc = doc(
  [
    node({ id: "start", kind: "terminator", label: "Início", w: 140, h: 60 }),
    node({ id: "check", kind: "decision", label: "Nota >= 7?", y: 90 }),
    node({ id: "approve", kind: "process", label: "Aprovado", y: 180 }),
    node({ id: "reject", kind: "process", label: "Reprovado", x: 220, y: 180 }),
    node({ id: "end", kind: "terminator", label: "Fim", y: 270, w: 140, h: 60 }),
  ],
  [
    edge("start", "check"),
    edge("check", "approve", "Sim"),
    edge("check", "reject", "Nao"),
    edge("approve", "end"),
    edge("reject", "end"),
  ],
);

const loopDoc = doc(
  [
    node({ id: "start", kind: "terminator", label: "Início", w: 140, h: 60 }),
    node({ id: "init", kind: "preparation", label: "i = 0", y: 90 }),
    node({ id: "check", kind: "decision", label: "i < 3?", y: 180 }),
    node({ id: "inc", kind: "process", label: "i = i + 1", y: 270 }),
    node({ id: "end", kind: "terminator", label: "Fim", y: 360, w: 140, h: 60 }),
  ],
  [
    edge("start", "init"),
    edge("init", "check"),
    edge("check", "inc", "Sim"),
    edge("check", "end", "Nao"),
    edge("inc", "check"),
  ],
);

const accentedDoc = doc(
  [
    node({ id: "start", kind: "terminator", label: "Início", w: 140, h: 60 }),
    node({ id: "calc", kind: "process", label: "Calcular média", y: 90 }),
    node({ id: "check", kind: "decision", label: "Média >= 7?", y: 180 }),
    node({ id: "end", kind: "terminator", label: "Fim", y: 270, w: 140, h: 60 }),
  ],
  [edge("start", "calc"), edge("calc", "check"), edge("check", "end", "Sim")],
);

const disconnectedDoc = doc([
  node({ id: "start", kind: "terminator", label: "Início", w: 140, h: 60 }),
  node({ id: "main", kind: "process", label: "Fluxo principal", y: 90 }),
  node({ id: "end", kind: "terminator", label: "Fim", y: 180, w: 140, h: 60 }),
  node({ id: "orphan", kind: "process", label: "Log extra", x: 360, y: 90 }),
]);

const emptyDoc: FlowDoc = { nodes: [], edges: [] };

function expectLanguageMarkers(code: string, language: (typeof CODE_LANGUAGES)[number]["id"]) {
  switch (language) {
    case "python":
      expect(code).toContain("def ");
      expect(code).toContain("class ");
      break;
    case "csharp":
      expect(code).toContain("using ");
      expect(code).toContain("class ");
      break;
    case "java":
      expect(code).toContain("import java.util.*;");
      expect(code).toContain("class ");
      break;
    case "javascript":
      expect(code).toContain("export ");
      expect(code).toContain("class ");
      break;
    case "cpp":
      expect(code).toContain("#include");
      expect(code).toContain("struct FlowContext");
      break;
  }
}

function expectLabelsPresent(code: string, labels: string[]) {
  for (const label of labels) {
    expect(code).toContain(label);
  }
}

function expectBlueprintMarkers(
  code: string,
  blueprint: (typeof CODE_BLUEPRINTS)[number]["id"],
  language: (typeof CODE_LANGUAGES)[number]["id"],
) {
  switch (blueprint) {
    case "procedural": {
      const runMarkers: Record<typeof language, RegExp> = {
        python: /run_flow/,
        csharp: /Run\(/,
        java: /\brun\(/,
        javascript: /runFlow/,
        cpp: /run_flow/,
      };
      expect(code).toMatch(runMarkers[language]);
      expect(code).not.toMatch(/DecisionStrategy|IDecisionStrategy|Strategy|pipeline|Command/i);
      break;
    }
    case "template-method": {
      const markers: Record<typeof language, RegExp> = {
        python: /@abstractmethod|class FlowTemplate\(ABC\)/i,
        csharp: /abstract class|abstract void|override/i,
        java: /abstract class|abstract void|extends FlowTemplate/i,
        javascript: /throw new Error|class FlowTemplate/i,
        cpp: /virtual|override|class FlowTemplate/i,
      };
      expect(code).toMatch(markers[language]);
      break;
    }
    case "strategy":
      expect(code).toMatch(/Strategy|decisionStrategy|decide/i);
      break;
    case "command-pipeline":
      expect(code).toMatch(/pipeline|Command|execute/i);
      break;
  }
}

describe("generateCode", () => {
  test("emits valid text for every language and blueprint on a linear flow", () => {
    for (const language of CODE_LANGUAGES) {
      for (const blueprint of CODE_BLUEPRINTS) {
        const code = generateCode(linearDoc, { language: language.id, blueprint: blueprint.id });

        expect(code).not.toContain("undefined");
        expect(code.length).toBeGreaterThan(100);
        expectLanguageMarkers(code, language.id);
        expectBlueprintMarkers(code, blueprint.id, language.id);
        expectLabelsPresent(code, [
          "Terminal: Início",
          "Dados (E/S): Ler dados",
          "Processo: Calcular total",
          "Terminal: Fim",
        ]);
      }
    }
  });

  test("template-method keeps the structural markers for every language", () => {
    for (const language of CODE_LANGUAGES) {
      const code = generateCode(decisionDoc, {
        language: language.id,
        blueprint: "template-method",
      });
      expect(code).not.toContain("undefined");
      expectBlueprintMarkers(code, "template-method", language.id);
      expectLabelsPresent(code, [
        "Terminal: Início",
        "Decisão: Nota >= 7?",
        "Processo: Aprovado",
        "Processo: Reprovado",
        "Terminal: Fim",
      ]);
    }
  });

  test("strategy blueprint exposes a decision strategy on a branching flow", () => {
    for (const language of CODE_LANGUAGES) {
      const code = generateCode(decisionDoc, { language: language.id, blueprint: "strategy" });
      expect(code).toMatch(/Strategy|decisionStrategy|decide/i);
      expectLabelsPresent(code, [
        "Terminal: Início",
        "Decisão: Nota >= 7?",
        "Processo: Aprovado",
        "Processo: Reprovado",
        "Terminal: Fim",
      ]);
    }
  });

  test("command pipeline keeps loop and disconnected steps in the generated text", () => {
    for (const language of CODE_LANGUAGES) {
      const loopCode = generateCode(loopDoc, {
        language: language.id,
        blueprint: "command-pipeline",
      });
      const orphanCode = generateCode(disconnectedDoc, {
        language: language.id,
        blueprint: "command-pipeline",
      });

      expect(loopCode).toMatch(/pipeline|Command|execute/i);
      expectLabelsPresent(loopCode, [
        "Terminal: Início",
        "Preparação: i = 0",
        "Decisão: i < 3?",
        "Processo: i = i + 1",
        "Terminal: Fim",
      ]);
      expect(orphanCode).toContain("Log extra");
      expectLabelsPresent(orphanCode, [
        "Terminal: Início",
        "Processo: Fluxo principal",
        "Terminal: Fim",
        "Processo: Log extra",
      ]);
    }
  });

  test("normalizes labels and tolerates empty documents", () => {
    for (const language of CODE_LANGUAGES) {
      const accentedCode = generateCode(accentedDoc, {
        language: language.id,
        blueprint: "procedural",
      });
      const emptyCode = generateCode(emptyDoc, { language: language.id, blueprint: "procedural" });

      expect(accentedCode).toMatch(
        /(step[_]?2[_]?calcular[_]?media|Step2CalcularMedia|step_2CalcularMedia)/i,
      );
      expect(accentedCode).toMatch(/(step[_]?3[_]?media[_]?7|Step3Media7|step_3Media_7)/i);
      expect(emptyCode).not.toContain("undefined");
      expect(emptyCode.length).toBeGreaterThan(0);
    }
  });
});
