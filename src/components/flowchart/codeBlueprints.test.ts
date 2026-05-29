import { describe, expect, test } from "bun:test";
import {
  CODE_BLUEPRINTS,
  CODE_LANGUAGES,
  generateArtifact,
  generateCode,
  getArtifactFileName,
} from "./codeBlueprints";
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
const groupedDoc: FlowDoc = {
  nodes: [
    node({ id: "group", kind: "group", label: "Grupo 1", w: 300, h: 220 }),
    node({ id: "start", kind: "terminator", label: "Início", w: 140, h: 60 }),
    node({ id: "task", kind: "process", label: "Executar etapa", y: 90 }),
    node({ id: "end", kind: "terminator", label: "Fim", y: 180, w: 140, h: 60 }),
  ],
  edges: [edge("start", "task"), edge("task", "end")],
};
const metadata = {
  title: "Sistema de Notas do Módulo",
  briefDescription: "Calcula e registra notas finais de alunos.",
  comments: "Usar em revisão de arquitetura.",
};

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

  test("uses the title as the source for namespaces, classes and filenames", () => {
    const csharp = generateCode(linearDoc, {
      language: "csharp",
      blueprint: "template-method",
      metadata,
    });
    const java = generateCode(linearDoc, {
      language: "java",
      blueprint: "strategy",
      metadata,
    });
    const cpp = generateCode(linearDoc, {
      language: "cpp",
      blueprint: "procedural",
      metadata,
    });

    expect(csharp).toContain("namespace FluxoLab.SistemaDeNotasDoModulo;");
    expect(csharp).toContain("public sealed class SistemaDeNotasDoModuloFlow");
    expect(java).toContain("package fluxolab.sistema_de_notas_do_modulo;");
    expect(java).toContain("public final class SistemaDeNotasDoModuloFlow");
    expect(cpp).toContain("namespace fluxolab::sistema_de_notas_do_modulo");
    expect(getArtifactFileName("code", { language: "java", metadata })).toBe(
      "SistemaDeNotasDoModuloFlow.java",
    );
  });

  test("generates UML and database scripts with metadata", () => {
    const uml = generateArtifact(linearDoc, {
      artifact: "uml",
      language: "python",
      blueprint: "procedural",
      metadata,
    });
    const database = generateArtifact(linearDoc, {
      artifact: "database",
      language: "python",
      blueprint: "procedural",
      metadata,
    });

    expect(uml).toContain("@startuml");
    expect(uml).toContain('title "Sistema de Notas do Módulo"');
    expect(uml).toContain("S1 --> S2");
    expect(uml).toContain("Comentarios: Usar em revisão de arquitetura.");

    expect(database).toContain('CREATE SCHEMA IF NOT EXISTS "sistema_de_notas_do_modulo";');
    expect(database).toContain('CREATE TABLE IF NOT EXISTS "sistema_de_notas_do_modulo".flow_step');
    expect(database).toContain("INSERT INTO");
    expect(database).toContain("'Sistema de Notas do Módulo'");
    expect(getArtifactFileName("database", { language: "python", metadata })).toBe(
      "sistema_de_notas_do_modulo.sql",
    );
  });

  test("treats grouping containers as code regions, never as steps", () => {
    const code = generateCode(groupedDoc, {
      language: "javascript",
      blueprint: "procedural",
      metadata,
    });

    // The container itself is never emitted as a callable step...
    expect(code).not.toContain("Agrupador: Grupo 1");
    expect(code).not.toContain("function step_group");
    // ...but it now structures the generated code as a region wrapping its members.
    expect(code).toContain("#region Grupo 1");
    expect(code).toContain("#endregion");
    expect(code).toContain("Executar etapa");
    expect(code).toContain("FLOW_NAMESPACE");
  });
});
