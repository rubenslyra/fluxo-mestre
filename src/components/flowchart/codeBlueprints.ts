import { SYMBOLS } from "./symbols";
import type { FlowDoc, FlowNode } from "./types";

export type CodeLanguage = "python" | "csharp" | "java" | "javascript" | "cpp";
export type CodeBlueprintId = "procedural" | "template-method" | "strategy" | "command-pipeline";
export type ArtifactKind = "code" | "uml" | "database";

export interface GenerationMetadata {
  title: string;
  briefDescription: string;
  comments?: string;
}

export interface GenerateCodeOptions {
  language: CodeLanguage;
  blueprint: CodeBlueprintId;
  metadata?: Partial<GenerationMetadata>;
}

export interface GenerateArtifactOptions {
  artifact: ArtifactKind;
  language: CodeLanguage;
  blueprint: CodeBlueprintId;
  metadata: GenerationMetadata;
}

export const CODE_LANGUAGES: Array<{ id: CodeLanguage; label: string; fileName: string }> = [
  { id: "python", label: "Python", fileName: "fluxolab_flow.py" },
  { id: "csharp", label: "C#", fileName: "FluxoLabFlow.cs" },
  { id: "java", label: "Java", fileName: "FluxoLabFlow.java" },
  { id: "javascript", label: "JavaScript", fileName: "fluxolab-flow.js" },
  { id: "cpp", label: "C/C++", fileName: "fluxolab_flow.cpp" },
];

export const CODE_BLUEPRINTS: Array<{
  id: CodeBlueprintId;
  label: string;
  summary: string;
}> = [
  {
    id: "procedural",
    label: "Procedural limpo",
    summary: "Funções pequenas, contexto explícito e ordem de execução legível.",
  },
  {
    id: "template-method",
    label: "Template Method",
    summary: "Algoritmo fixo com passos sobrescritos por subclasses.",
  },
  {
    id: "strategy",
    label: "Strategy",
    summary: "Composição para trocar decisões e políticas em runtime.",
  },
  {
    id: "command-pipeline",
    label: "Command Pipeline",
    summary: "Passos isolados, testáveis e encadeados como comandos.",
  },
];

export const ARTIFACT_TARGETS: Array<{
  id: ArtifactKind;
  label: string;
  summary: string;
}> = [
  {
    id: "code",
    label: "Código",
    summary: "Classe, funções ou pipeline a partir dos símbolos do fluxograma.",
  },
  {
    id: "uml",
    label: "UML",
    summary: "Diagrama PlantUML com estados, transições e rótulos de decisão.",
  },
  {
    id: "database",
    label: "SQL",
    summary: "Modelo relacional para persistir fluxo, passos e transições.",
  },
];

export const CODE_REFERENCE_LINKS = [
  "Refactoring.Guru: Template Method, Strategy e Command",
  "Microsoft Learn: Design Patterns - Template Method",
  "MDN: modelo de padrões da Web e separação de responsabilidades",
  "IBM: arquiteturas em camadas, microservices e padrões reutilizáveis",
  "Martin Fowler: arquitetura evolutiva e separação de domínio/dados/apresentação",
];

type CodeModel = {
  title: string;
  briefDescription: string;
  comments: string;
  namespace: string;
  packageName: string;
  cppNamespace: string;
  schemaName: string;
  className: string;
  moduleName: string;
  flowKey: string;
  steps: CodeStep[];
  decisions: CodeStep[];
  transitions: CodeTransition[];
};

type CodeStep = {
  nodeId: string;
  index: number;
  label: string;
  kindName: string;
  methodName: string;
  constantName: string;
};

type CodeTransition = {
  from: CodeStep;
  to: CodeStep;
  label?: string;
};

export function generateCode(doc: FlowDoc, options: GenerateCodeOptions) {
  const model = createCodeModel(doc, options.metadata);
  if (options.language === "python") return generatePython(model, options.blueprint);
  if (options.language === "csharp") return generateCSharp(model, options.blueprint);
  if (options.language === "java") return generateJava(model, options.blueprint);
  if (options.language === "javascript") return generateJavaScript(model, options.blueprint);
  return generateCpp(model, options.blueprint);
}

export function generateArtifact(doc: FlowDoc, options: GenerateArtifactOptions) {
  if (options.artifact === "uml") return generateUml(createCodeModel(doc, options.metadata));
  if (options.artifact === "database") {
    return generateDatabaseScript(createCodeModel(doc, options.metadata));
  }
  return generateCode(doc, {
    language: options.language,
    blueprint: options.blueprint,
    metadata: options.metadata,
  });
}

export function getArtifactFileName(
  artifact: ArtifactKind,
  options: { language: CodeLanguage; metadata: Partial<GenerationMetadata> },
) {
  const title = normalizeMetadata(options.metadata).title;
  const base = makeIdentifier(title) || "fluxolab_flow";
  const className = makeClassName(title);

  if (artifact === "uml") return `${base}.puml`;
  if (artifact === "database") return `${base}.sql`;

  if (options.language === "python") return `${base}.py`;
  if (options.language === "csharp") return `${className}.cs`;
  if (options.language === "java") return `${className}.java`;
  if (options.language === "javascript") return `${base}.js`;
  return `${base}.cpp`;
}

function createCodeModel(doc: FlowDoc, metadata?: Partial<GenerationMetadata>): CodeModel {
  const normalizedMetadata = normalizeMetadata(metadata, doc);
  const flowDoc = {
    nodes: doc.nodes.filter((node) => node.kind !== "group"),
    edges: doc.edges,
  };
  const orderedNodes = orderNodes(flowDoc);
  const steps = orderedNodes.map((node, index) => {
    const label = node.label.trim() || SYMBOLS[node.kind].defaultLabel;
    return {
      nodeId: node.id,
      index: index + 1,
      label,
      kindName: SYMBOLS[node.kind].name,
      methodName: makeIdentifier(`${index + 1}_${label}`),
      constantName: makeConstant(`${index + 1}_${label}`),
    };
  });
  const stepsByNodeId = new Map(steps.map((step) => [step.nodeId, step]));

  return {
    title: normalizedMetadata.title,
    briefDescription: normalizedMetadata.briefDescription,
    comments: normalizedMetadata.comments?.trim() ?? "",
    namespace: makeNamespace(normalizedMetadata.title),
    packageName: makePackageName(normalizedMetadata.title),
    cppNamespace: makeCppNamespace(normalizedMetadata.title),
    schemaName: makeSqlIdentifier(normalizedMetadata.title),
    className: makeClassName(normalizedMetadata.title),
    moduleName: makeIdentifier(normalizedMetadata.title) || "fluxolab_flow",
    flowKey: makeIdentifier(normalizedMetadata.title) || "fluxolab_flow",
    steps,
    decisions: steps.filter((step) => step.kindName === SYMBOLS.decision.name),
    transitions: flowDoc.edges.flatMap((edge) => {
      const from = stepsByNodeId.get(edge.from);
      const to = stepsByNodeId.get(edge.to);
      return from && to ? [{ from, to, label: edge.label }] : [];
    }),
  };
}

function orderNodes(doc: FlowDoc) {
  const byId = new Map(doc.nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  for (const edge of doc.edges) {
    const list = outgoing.get(edge.from) ?? [];
    list.push(edge.to);
    outgoing.set(edge.from, list);
  }

  const start =
    doc.nodes.find(
      (node) =>
        node.kind === "terminator" &&
        node.label
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes("inicio"),
    ) ?? doc.nodes[0];

  const visited = new Set<string>();
  const result: FlowNode[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    const node = byId.get(nodeId);
    if (!node) return;
    visited.add(nodeId);
    result.push(node);
    for (const next of outgoing.get(nodeId) ?? []) visit(next);
  }

  if (start) visit(start.id);

  const remaining = doc.nodes
    .filter((node) => !visited.has(node.id))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  return [...result, ...remaining];
}

function makeTitle(doc: FlowDoc) {
  const start = doc.nodes.find((node) => node.kind === "terminator")?.label.trim();
  return start ? `FluxoLab - ${start}` : "FluxoLab Flow";
}

function normalizeMetadata(
  metadata?: Partial<GenerationMetadata>,
  doc?: FlowDoc,
): GenerationMetadata {
  const title = metadata?.title?.trim() || (doc ? makeTitle(doc) : "FluxoLab Flow");
  return {
    title,
    briefDescription:
      metadata?.briefDescription?.trim() ||
      (doc
        ? `Fluxo com ${doc.nodes.length} simbolo(s) e ${doc.edges.length} conexao(oes).`
        : "Artefato gerado a partir do fluxograma."),
    comments: metadata?.comments?.trim() || "",
  };
}

function makeIdentifier(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  if (!normalized) return "step";
  return /^[a-z_]/.test(normalized) ? normalized : `step_${normalized}`;
}

function makePascal(value: string) {
  return makeIdentifier(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function makeClassName(value: string) {
  const base = makePascal(value) || "FluxoLab";
  return /flow$/i.test(base) || /fluxo$/i.test(base) ? base : `${base}Flow`;
}

function makeNamespace(value: string) {
  const base = makePascal(value) || "Flow";
  return `FluxoLab.${base}`;
}

function makePackageName(value: string) {
  const base = makeIdentifier(value) || "flow";
  return `fluxolab.${base}`;
}

function makeCppNamespace(value: string) {
  const base = makeIdentifier(value) || "flow";
  return `fluxolab::${base}`;
}

function makeSqlIdentifier(value: string) {
  return makeIdentifier(value) || "fluxolab_flow";
}

function makeConstant(value: string) {
  return makeIdentifier(value).toUpperCase();
}

function escapeComment(value: string) {
  return value.replace(/\*\//g, "* /");
}

function escapeLineComment(value: string) {
  return value.replace(/\r?\n/g, " ");
}

function escapeUml(value: string) {
  return value.replace(/"/g, '\\"');
}

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function cStyleHeader(model: CodeModel) {
  return `/*
 * Titulo: ${escapeComment(escapeLineComment(model.title))}
 * Descricao breve: ${escapeComment(escapeLineComment(model.briefDescription))}
${model.comments ? ` * Comentarios: ${escapeComment(escapeLineComment(model.comments))}\n` : ""} */

`;
}

function lineHeader(model: CodeModel, prefix: string) {
  return `${prefix} Titulo: ${escapeLineComment(model.title)}
${prefix} Descricao breve: ${escapeLineComment(model.briefDescription)}
${model.comments ? `${prefix} Comentarios: ${escapeLineComment(model.comments)}\n` : ""}
`;
}

function quote(value: string) {
  return JSON.stringify(value);
}

function pythonStepFunctions(model: CodeModel) {
  return model.steps
    .map(
      (step) => `def ${step.methodName}(context: FlowContext) -> None:
    """${step.kindName}: ${step.label}"""
    # TODO: implementar regra do símbolo "${step.label}".
    context.audit.append(${quote(`${step.kindName}: ${step.label}`)})
`,
    )
    .join("\n");
}

function generatePython(model: CodeModel, blueprint: CodeBlueprintId) {
  const header = lineHeader(model, "#");
  const stepNames = model.steps.map((step) => step.methodName).join(",\n    ");
  const stepMethods = model.steps
    .map((step) => `        self.${step.methodName}(context)  # ${step.kindName}: ${step.label}`)
    .join("\n");
  const abstractMethods = model.steps
    .map(
      (step) => `    @abstractmethod
    def ${step.methodName}(self, context: FlowContext) -> None:
        pass
`,
    )
    .join("\n");
  const concreteMethods = model.steps
    .map(
      (step) => `    def ${step.methodName}(self, context: FlowContext) -> None:
        context.audit.append(${quote(`${step.kindName}: ${step.label}`)})
        # TODO: implementar regra do símbolo "${step.label}".
`,
    )
    .join("\n");

  if (blueprint === "template-method") {
    return `${header}from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

FLOW_NAMESPACE = ${quote(model.packageName)}


@dataclass
class FlowContext:
    data: dict[str, Any] = field(default_factory=dict)
    audit: list[str] = field(default_factory=list)


class FlowTemplate(ABC):
    def run(self, context: FlowContext) -> None:
${stepMethods || "        pass"}

${abstractMethods}

class ${model.className}(FlowTemplate):
${concreteMethods || "    pass\n"}


if __name__ == "__main__":
    ${model.className}().run(FlowContext())
`;
  }

  if (blueprint === "strategy") {
    const decisions = model.decisions.length
      ? model.decisions
          .map(
            (step) => `class ${makePascal(step.methodName)}Strategy:
    def decide(self, context: FlowContext) -> bool:
        # TODO: implementar decisão "${step.label}".
        return False
`,
          )
          .join("\n")
      : `class DefaultDecisionStrategy:
    def decide(self, context: FlowContext) -> bool:
        return True
`;

    return `${header}from dataclasses import dataclass, field
from typing import Any, Protocol

FLOW_NAMESPACE = ${quote(model.packageName)}


@dataclass
class FlowContext:
    data: dict[str, Any] = field(default_factory=dict)
    audit: list[str] = field(default_factory=list)


class DecisionStrategy(Protocol):
    def decide(self, context: FlowContext) -> bool: ...


${decisions}
${pythonStepFunctions(model)}
def run_flow(context: FlowContext, decision_strategy: DecisionStrategy) -> None:
    context.audit.append(${quote(model.title)})
    # Injete estrategias diferentes em testes, CLI, API ou jobs.
    decision_strategy.decide(context)
    for step in FLOW_STEPS:
        step(context)


FLOW_STEPS = [
    ${stepNames}
]
`;
  }

  if (blueprint === "command-pipeline") {
    return `${header}from dataclasses import dataclass, field
from typing import Any, Protocol

FLOW_NAMESPACE = ${quote(model.packageName)}


@dataclass
class FlowContext:
    data: dict[str, Any] = field(default_factory=dict)
    audit: list[str] = field(default_factory=list)


class FlowCommand(Protocol):
    def execute(self, context: FlowContext) -> None: ...


class AuditCommand:
    def __init__(self, label: str) -> None:
        self.label = label

    def execute(self, context: FlowContext) -> None:
        context.audit.append(self.label)


PIPELINE: list[FlowCommand] = [
${model.steps.map((step) => `    AuditCommand(${quote(`${step.kindName}: ${step.label}`)}),`).join("\n")}
]


def run_flow(context: FlowContext) -> None:
    for command in PIPELINE:
        command.execute(context)
`;
  }

  return `${header}from dataclasses import dataclass, field
from typing import Any, Callable

FLOW_NAMESPACE = ${quote(model.packageName)}


@dataclass
class FlowContext:
    data: dict[str, Any] = field(default_factory=dict)
    audit: list[str] = field(default_factory=list)


${pythonStepFunctions(model)}
FLOW_STEPS: list[Callable[[FlowContext], None]] = [
    ${stepNames}
]


def run_flow(context: FlowContext) -> None:
    for step in FLOW_STEPS:
        step(context)
`;
}

function generateCSharp(model: CodeModel, blueprint: CodeBlueprintId) {
  const header = cStyleHeader(model);
  const methods = model.steps
    .map(
      (step) => `    private static void ${makePascal(step.methodName)}(FlowContext context)
    {
        context.Audit.Add(${quote(escapeComment(`${step.kindName}: ${step.label}`))});
        // TODO: implementar regra do símbolo "${escapeComment(step.label)}".
    }
`,
    )
    .join("\n");
  const calls = model.steps
    .map((step) => `        ${makePascal(step.methodName)}(context);`)
    .join("\n");
  const abstractCalls = model.steps
    .map((step) => `        ${makePascal(step.methodName)}(context);`)
    .join("\n");
  const abstractMethods = model.steps
    .map(
      (step) => `    protected abstract void ${makePascal(step.methodName)}(FlowContext context);`,
    )
    .join("\n");
  const overrideMethods = model.steps
    .map(
      (step) => `    protected override void ${makePascal(step.methodName)}(FlowContext context)
    {
        context.Audit.Add(${quote(escapeComment(`${step.kindName}: ${step.label}`))});
    }
`,
    )
    .join("\n");

  if (blueprint === "template-method") {
    return `${header}using System.Collections.Generic;

namespace ${model.namespace};

public sealed class FlowContext
{
    public Dictionary<string, object?> Data { get; } = new();
    public List<string> Audit { get; } = new();
}

public abstract class FlowTemplate
{
    public void Run(FlowContext context)
    {
${abstractCalls || "        return;"}
    }

${abstractMethods}
}

public sealed class ${model.className} : FlowTemplate
{
${overrideMethods || ""}
}
`;
  }

  if (blueprint === "strategy") {
    return `${header}using System.Collections.Generic;

namespace ${model.namespace};

public sealed class FlowContext
{
    public Dictionary<string, object?> Data { get; } = new();
    public List<string> Audit { get; } = new();
}

public interface IDecisionStrategy
{
    bool Decide(FlowContext context);
}

public sealed class DefaultDecisionStrategy : IDecisionStrategy
{
    public bool Decide(FlowContext context) => true;
}

public sealed class ${model.className}
{
    private readonly IDecisionStrategy _decisionStrategy;

    public ${model.className}(IDecisionStrategy decisionStrategy)
    {
        _decisionStrategy = decisionStrategy;
    }

    public void Run(FlowContext context)
    {
        _decisionStrategy.Decide(context);
${calls || "        return;"}
    }

${methods}
}
`;
  }

  if (blueprint === "command-pipeline") {
    const commandClasses = model.steps
      .map(
        (step) => `public sealed class ${makePascal(step.methodName)}Command : IFlowCommand
{
    public void Execute(FlowContext context)
    {
        context.Audit.Add(${quote(escapeComment(`${step.kindName}: ${step.label}`))});
    }
}
`,
      )
      .join("\n");
    return `${header}using System.Collections.Generic;

namespace ${model.namespace};

public sealed class FlowContext
{
    public Dictionary<string, object?> Data { get; } = new();
    public List<string> Audit { get; } = new();
}

public interface IFlowCommand
{
    void Execute(FlowContext context);
}

${commandClasses}
public sealed class ${model.className}
{
    private readonly IReadOnlyList<IFlowCommand> _pipeline = new IFlowCommand[]
    {
${model.steps.map((step) => `        new ${makePascal(step.methodName)}Command(),`).join("\n")}
    };

    public void Run(FlowContext context)
    {
        foreach (var command in _pipeline)
            command.Execute(context);
    }
}
`;
  }

  return `${header}using System;
using System.Collections.Generic;

namespace ${model.namespace};

public sealed class FlowContext
{
    public Dictionary<string, object?> Data { get; } = new();
    public List<string> Audit { get; } = new();
}

public static class ${model.className}
{
    public static void Run(FlowContext context)
    {
${calls || "        return;"}
    }

${methods}
}
`;
}

function generateJava(model: CodeModel, blueprint: CodeBlueprintId) {
  const header = cStyleHeader(model);
  const methodCalls = model.steps
    .map(
      (step) =>
        `        ${makeIdentifier(step.methodName).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}(context);`,
    )
    .join("\n");
  const methods = model.steps
    .map((step) => {
      const name = makeIdentifier(step.methodName).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      return `    private static void ${name}(FlowContext context) {
        context.audit.add(${quote(escapeComment(`${step.kindName}: ${step.label}`))});
        // TODO: implementar regra do símbolo "${escapeComment(step.label)}".
    }
`;
    })
    .join("\n");

  if (blueprint === "template-method") {
    const abstractCalls = model.steps
      .map(
        (step) =>
          `        ${makeIdentifier(step.methodName).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}(context);`,
      )
      .join("\n");
    const abstractMethods = model.steps
      .map(
        (step) =>
          `    protected abstract void ${makeIdentifier(step.methodName).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}(FlowContext context);`,
      )
      .join("\n");
    return `${header}package ${model.packageName};

import java.util.*;

class FlowContext {
    final Map<String, Object> data = new HashMap<>();
    final List<String> audit = new ArrayList<>();
}

abstract class FlowTemplate {
    public final void run(FlowContext context) {
${abstractCalls || "        return;"}
    }

${abstractMethods}
}

public final class ${model.className} extends FlowTemplate {
${methods.replaceAll("private static", "protected")}
}
`;
  }

  if (blueprint === "strategy") {
    return `${header}package ${model.packageName};

import java.util.*;

class FlowContext {
    final Map<String, Object> data = new HashMap<>();
    final List<String> audit = new ArrayList<>();
}

interface DecisionStrategy {
    boolean decide(FlowContext context);
}

public final class ${model.className} {
    private final DecisionStrategy decisionStrategy;

    public ${model.className}(DecisionStrategy decisionStrategy) {
        this.decisionStrategy = decisionStrategy;
    }

    public void run(FlowContext context) {
        decisionStrategy.decide(context);
${methodCalls || "        return;"}
    }

${methods}
}
`;
  }

  if (blueprint === "command-pipeline") {
    return `${header}package ${model.packageName};

import java.util.*;

class FlowContext {
    final Map<String, Object> data = new HashMap<>();
    final List<String> audit = new ArrayList<>();
}

interface FlowCommand {
    void execute(FlowContext context);
}

public final class ${model.className} {
    private final List<FlowCommand> pipeline = List.of(
${model.steps.map((step) => `        context -> context.audit.add(${quote(escapeComment(`${step.kindName}: ${step.label}`))})`).join(",\n")}
    );

    public void run(FlowContext context) {
        for (FlowCommand command : pipeline) {
            command.execute(context);
        }
    }
}
`;
  }

  return `${header}package ${model.packageName};

import java.util.*;

class FlowContext {
    final Map<String, Object> data = new HashMap<>();
    final List<String> audit = new ArrayList<>();
}

public final class ${model.className} {
    public static void run(FlowContext context) {
${methodCalls || "        return;"}
    }

${methods}
}
`;
}

function generateJavaScript(model: CodeModel, blueprint: CodeBlueprintId) {
  const header = lineHeader(model, "//");
  const functions = model.steps
    .map(
      (step) => `function ${step.methodName}(context) {
  context.audit.push(${quote(escapeComment(`${step.kindName}: ${step.label}`))});
  // TODO: implementar regra do símbolo "${escapeComment(step.label)}".
}
`,
    )
    .join("\n");
  const stepArray = model.steps.map((step) => `  ${step.methodName},`).join("\n");

  if (blueprint === "template-method") {
    return `${header}export const FLOW_NAMESPACE = ${quote(model.packageName)};

export class FlowContext {
  constructor() {
    this.data = new Map();
    this.audit = [];
  }
}

export class FlowTemplate {
  run(context) {
${model.steps.map((step) => `    this.${step.methodName}(context);`).join("\n") || "    return;"}
  }
${model.steps
  .map(
    (step) => `
  ${step.methodName}() {
    throw new Error(${quote(`Implemente ${step.label}`)});
  }`,
  )
  .join("\n")}
}

export class ${model.className} extends FlowTemplate {
${model.steps
  .map(
    (step) => `  ${step.methodName}(context) {
    context.audit.push(${quote(escapeComment(`${step.kindName}: ${step.label}`))});
  }
`,
  )
  .join("\n")}
}
`;
  }

  if (blueprint === "strategy") {
    return `${header}export const FLOW_NAMESPACE = ${quote(model.packageName)};

export class FlowContext {
  constructor() {
    this.data = new Map();
    this.audit = [];
  }
}

export class ${model.className} {
  constructor(decisionStrategy) {
    this.decisionStrategy = decisionStrategy;
  }

  run(context) {
    this.decisionStrategy.decide(context);
    for (const step of FLOW_STEPS) step(context);
  }
}

${functions}
export const FLOW_STEPS = [
${stepArray}
];
`;
  }

  if (blueprint === "command-pipeline") {
    return `${header}export const FLOW_NAMESPACE = ${quote(model.packageName)};

export class FlowContext {
  constructor() {
    this.data = new Map();
    this.audit = [];
  }
}

export class AuditCommand {
  constructor(label) {
    this.label = label;
  }

  execute(context) {
    context.audit.push(this.label);
  }
}

export const pipeline = [
${model.steps.map((step) => `  new AuditCommand(${quote(escapeComment(`${step.kindName}: ${step.label}`))}),`).join("\n")}
];

export function runFlow(context) {
  for (const command of pipeline) command.execute(context);
}
`;
  }

  return `${header}export const FLOW_NAMESPACE = ${quote(model.packageName)};

export class FlowContext {
  constructor() {
    this.data = new Map();
    this.audit = [];
  }
}

${functions}
export const FLOW_STEPS = [
${stepArray}
];

export function runFlow(context) {
  for (const step of FLOW_STEPS) step(context);
}
`;
}

function generateCpp(model: CodeModel, blueprint: CodeBlueprintId) {
  const header = cStyleHeader(model);
  const methods = model.steps
    .map(
      (step) => `void ${step.methodName}(FlowContext& context) {
    context.audit.push_back(${quote(escapeComment(`${step.kindName}: ${step.label}`))});
    // TODO: implementar regra do símbolo "${escapeComment(step.label)}".
}
`,
    )
    .join("\n");
  const calls = model.steps.map((step) => `    ${step.methodName}(context);`).join("\n");

  if (blueprint === "template-method") {
    return `${header}#include <string>
#include <unordered_map>
#include <vector>

namespace ${model.cppNamespace} {

struct FlowContext {
    std::unordered_map<std::string, std::string> data;
    std::vector<std::string> audit;
};

class FlowTemplate {
public:
    void run(FlowContext& context) {
${model.steps.map((step) => `        ${step.methodName}(context);`).join("\n") || "        return;"}
    }

protected:
${model.steps.map((step) => `    virtual void ${step.methodName}(FlowContext& context) = 0;`).join("\n")}
};

class ${model.className} final : public FlowTemplate {
protected:
${model.steps
  .map(
    (step) => `    void ${step.methodName}(FlowContext& context) override {
        context.audit.push_back(${quote(escapeComment(`${step.kindName}: ${step.label}`))});
    }
`,
  )
  .join("\n")}
};

}  // namespace ${model.cppNamespace}
`;
  }

  if (blueprint === "strategy") {
    return `${header}#include <memory>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

namespace ${model.cppNamespace} {

struct FlowContext {
    std::unordered_map<std::string, std::string> data;
    std::vector<std::string> audit;
};

struct DecisionStrategy {
    virtual ~DecisionStrategy() = default;
    virtual bool decide(const FlowContext& context) const = 0;
};

class ${model.className} {
public:
    explicit ${model.className}(std::shared_ptr<DecisionStrategy> strategy)
        : strategy_(std::move(strategy)) {}

    void run(FlowContext& context) {
        if (strategy_) strategy_->decide(context);
${calls || "        return;"}
    }

private:
    std::shared_ptr<DecisionStrategy> strategy_;
};

${methods}
}  // namespace ${model.cppNamespace}
`;
  }

  if (blueprint === "command-pipeline") {
    return `${header}#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

namespace ${model.cppNamespace} {

struct FlowContext {
    std::unordered_map<std::string, std::string> data;
    std::vector<std::string> audit;
};

using FlowCommand = std::function<void(FlowContext&)>;

const std::vector<FlowCommand> pipeline = {
${model.steps.map((step) => `    [](FlowContext& context) { context.audit.push_back(${quote(escapeComment(`${step.kindName}: ${step.label}`))}); },`).join("\n")}
};

void run_flow(FlowContext& context) {
    for (const auto& command : pipeline) command(context);
}

}  // namespace ${model.cppNamespace}
`;
  }

  return `${header}#include <string>
#include <unordered_map>
#include <vector>

namespace ${model.cppNamespace} {

struct FlowContext {
    std::unordered_map<std::string, std::string> data;
    std::vector<std::string> audit;
};

${methods}
void run_flow(FlowContext& context) {
${calls || "    return;"}
}

}  // namespace ${model.cppNamespace}
`;
}

function umlStateId(step: CodeStep) {
  return `S${step.index}`;
}

function isEndStep(step: CodeStep) {
  const normalized = step.label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return step.kindName === SYMBOLS.terminator.name && /(fim|final|end)\b/.test(normalized);
}

function generateUml(model: CodeModel) {
  const header = lineHeader(model, "'");
  const states = model.steps
    .map(
      (step) =>
        `state "${escapeUml(`${step.index}. ${step.kindName}\\n${step.label}`)}" as ${umlStateId(step)}`,
    )
    .join("\n");
  const transitions = model.transitions
    .map(
      (transition) =>
        `${umlStateId(transition.from)} --> ${umlStateId(transition.to)}${
          transition.label ? ` : ${escapeUml(transition.label)}` : ""
        }`,
    )
    .join("\n");
  const firstStep = model.steps[0];
  const outgoingIds = new Set(model.transitions.map((transition) => transition.from.nodeId));
  const endTransitions = model.steps
    .filter((step) => isEndStep(step) && !outgoingIds.has(step.nodeId))
    .map((step) => `${umlStateId(step)} --> [*]`)
    .join("\n");
  const note = firstStep
    ? `note top of ${umlStateId(firstStep)}
${escapeUml(model.briefDescription)}
${model.comments ? `\nComentarios: ${escapeUml(model.comments)}` : ""}
end note`
    : "";

  return `${header}@startuml
title "${escapeUml(model.title)}"
hide empty description
skinparam linetype ortho
skinparam shadowing false

${states || "' Nenhum estado encontrado."}
${firstStep ? `[*] --> ${umlStateId(firstStep)}` : ""}
${transitions || "' Nenhuma transicao encontrada."}
${endTransitions}
${note}
@enduml
`;
}

function generateDatabaseScript(model: CodeModel) {
  const header = lineHeader(model, "--");
  const schema = sqlIdentifier(model.schemaName);
  const flowDefinition = `${schema}.flow_definition`;
  const flowStep = `${schema}.flow_step`;
  const flowTransition = `${schema}.flow_transition`;
  const flowKey = sqlString(model.flowKey);
  const stepRows = model.steps
    .map(
      (step) =>
        `  (${flowKey}, ${sqlString(step.nodeId)}, ${step.index}, ${sqlString(
          step.kindName,
        )}, ${sqlString(step.label)}, ${sqlString(step.methodName)})`,
    )
    .join(",\n");
  const transitionRows = model.transitions
    .map(
      (transition, index) =>
        `  (${flowKey}, ${index + 1}, ${sqlString(transition.from.nodeId)}, ${sqlString(
          transition.to.nodeId,
        )}, ${transition.label ? sqlString(transition.label) : "NULL"})`,
    )
    .join(",\n");

  return `${header}CREATE SCHEMA IF NOT EXISTS ${schema};

CREATE TABLE IF NOT EXISTS ${flowDefinition} (
  flow_key VARCHAR(160) PRIMARY KEY,
  title TEXT NOT NULL,
  brief_description TEXT NOT NULL,
  comments TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ${flowStep} (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  flow_key VARCHAR(160) NOT NULL REFERENCES ${flowDefinition}(flow_key) ON DELETE CASCADE,
  step_key VARCHAR(120) NOT NULL,
  step_order INTEGER NOT NULL,
  symbol_kind VARCHAR(80) NOT NULL,
  label TEXT NOT NULL,
  method_name VARCHAR(160) NOT NULL,
  UNIQUE (flow_key, step_key)
);

CREATE TABLE IF NOT EXISTS ${flowTransition} (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  flow_key VARCHAR(160) NOT NULL REFERENCES ${flowDefinition}(flow_key) ON DELETE CASCADE,
  transition_order INTEGER NOT NULL,
  from_step_key VARCHAR(120) NOT NULL,
  to_step_key VARCHAR(120) NOT NULL,
  label TEXT NULL,
  CONSTRAINT fk_flow_transition_from
    FOREIGN KEY (flow_key, from_step_key) REFERENCES ${flowStep}(flow_key, step_key),
  CONSTRAINT fk_flow_transition_to
    FOREIGN KEY (flow_key, to_step_key) REFERENCES ${flowStep}(flow_key, step_key)
);

INSERT INTO ${flowDefinition} (flow_key, title, brief_description, comments)
VALUES (${flowKey}, ${sqlString(model.title)}, ${sqlString(model.briefDescription)}, ${
    model.comments ? sqlString(model.comments) : "NULL"
  })
ON CONFLICT (flow_key) DO UPDATE SET
  title = EXCLUDED.title,
  brief_description = EXCLUDED.brief_description,
  comments = EXCLUDED.comments;

DELETE FROM ${flowTransition} WHERE flow_key = ${flowKey};
DELETE FROM ${flowStep} WHERE flow_key = ${flowKey};

${
  stepRows
    ? `INSERT INTO ${flowStep} (flow_key, step_key, step_order, symbol_kind, label, method_name)
VALUES
${stepRows};`
    : "-- Nenhum passo para inserir."
}

${
  transitionRows
    ? `INSERT INTO ${flowTransition} (flow_key, transition_order, from_step_key, to_step_key, label)
VALUES
${transitionRows};`
    : "-- Nenhuma transicao para inserir."
}
`;
}
