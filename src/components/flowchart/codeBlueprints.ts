import { SYMBOLS } from "./symbols";
import type { FlowDoc, FlowNode } from "./types";

export type CodeLanguage = "python" | "csharp" | "java" | "javascript" | "cpp";
export type CodeBlueprintId = "procedural" | "template-method" | "strategy" | "command-pipeline";

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

export const CODE_REFERENCE_LINKS = [
  "Refactoring.Guru: Template Method, Strategy e Command",
  "Microsoft Learn: Design Patterns - Template Method",
  "MDN: modelo de padrões da Web e separação de responsabilidades",
  "IBM: arquiteturas em camadas, microservices e padrões reutilizáveis",
  "Martin Fowler: arquitetura evolutiva e separação de domínio/dados/apresentação",
];

type CodeModel = {
  title: string;
  steps: CodeStep[];
  decisions: CodeStep[];
};

type CodeStep = {
  index: number;
  label: string;
  kindName: string;
  methodName: string;
  constantName: string;
};

export function generateCode(
  doc: FlowDoc,
  options: { language: CodeLanguage; blueprint: CodeBlueprintId },
) {
  const model = createCodeModel(doc);
  if (options.language === "python") return generatePython(model, options.blueprint);
  if (options.language === "csharp") return generateCSharp(model, options.blueprint);
  if (options.language === "java") return generateJava(model, options.blueprint);
  if (options.language === "javascript") return generateJavaScript(model, options.blueprint);
  return generateCpp(model, options.blueprint);
}

function createCodeModel(doc: FlowDoc): CodeModel {
  const orderedNodes = orderNodes(doc);
  const steps = orderedNodes.map((node, index) => {
    const label = node.label.trim() || SYMBOLS[node.kind].defaultLabel;
    return {
      index: index + 1,
      label,
      kindName: SYMBOLS[node.kind].name,
      methodName: makeIdentifier(`${index + 1}_${label}`),
      constantName: makeConstant(`${index + 1}_${label}`),
    };
  });

  return {
    title: makeTitle(doc),
    steps,
    decisions: steps.filter((step) => step.kindName === SYMBOLS.decision.name),
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

function makeConstant(value: string) {
  return makeIdentifier(value).toUpperCase();
}

function escapeComment(value: string) {
  return value.replace(/\*\//g, "* /");
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
    return `from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class FlowContext:
    data: dict[str, Any] = field(default_factory=dict)
    audit: list[str] = field(default_factory=list)


class FlowTemplate(ABC):
    def run(self, context: FlowContext) -> None:
${stepMethods || "        pass"}

${abstractMethods}

class GeneratedFlow(FlowTemplate):
${concreteMethods || "    pass\n"}


if __name__ == "__main__":
    GeneratedFlow().run(FlowContext())
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

    return `from dataclasses import dataclass, field
from typing import Any, Protocol


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
    return `from dataclasses import dataclass, field
from typing import Any, Protocol


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

  return `from dataclasses import dataclass, field
from typing import Any, Callable


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
    return `using System.Collections.Generic;

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

public sealed class GeneratedFlow : FlowTemplate
{
${overrideMethods || ""}
}
`;
  }

  if (blueprint === "strategy") {
    return `using System.Collections.Generic;

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

public sealed class GeneratedFlow
{
    private readonly IDecisionStrategy _decisionStrategy;

    public GeneratedFlow(IDecisionStrategy decisionStrategy)
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
    return `using System.Collections.Generic;

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
public sealed class GeneratedFlow
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

  return `using System;
using System.Collections.Generic;

public sealed class FlowContext
{
    public Dictionary<string, object?> Data { get; } = new();
    public List<string> Audit { get; } = new();
}

public static class GeneratedFlow
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
    return `import java.util.*;

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

public final class FluxoLabFlow extends FlowTemplate {
${methods.replaceAll("private static", "protected")}
}
`;
  }

  if (blueprint === "strategy") {
    return `import java.util.*;

class FlowContext {
    final Map<String, Object> data = new HashMap<>();
    final List<String> audit = new ArrayList<>();
}

interface DecisionStrategy {
    boolean decide(FlowContext context);
}

public final class FluxoLabFlow {
    private final DecisionStrategy decisionStrategy;

    public FluxoLabFlow(DecisionStrategy decisionStrategy) {
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
    return `import java.util.*;

class FlowContext {
    final Map<String, Object> data = new HashMap<>();
    final List<String> audit = new ArrayList<>();
}

interface FlowCommand {
    void execute(FlowContext context);
}

public final class FluxoLabFlow {
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

  return `import java.util.*;

class FlowContext {
    final Map<String, Object> data = new HashMap<>();
    final List<String> audit = new ArrayList<>();
}

public final class FluxoLabFlow {
    public static void run(FlowContext context) {
${methodCalls || "        return;"}
    }

${methods}
}
`;
}

function generateJavaScript(model: CodeModel, blueprint: CodeBlueprintId) {
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
    return `export class FlowContext {
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

export class GeneratedFlow extends FlowTemplate {
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
    return `export class FlowContext {
  constructor() {
    this.data = new Map();
    this.audit = [];
  }
}

export class GeneratedFlow {
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
    return `export class FlowContext {
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

  return `export class FlowContext {
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
    return `#include <string>
#include <unordered_map>
#include <vector>

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

class GeneratedFlow final : public FlowTemplate {
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
`;
  }

  if (blueprint === "strategy") {
    return `#include <memory>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

struct FlowContext {
    std::unordered_map<std::string, std::string> data;
    std::vector<std::string> audit;
};

struct DecisionStrategy {
    virtual ~DecisionStrategy() = default;
    virtual bool decide(const FlowContext& context) const = 0;
};

class GeneratedFlow {
public:
    explicit GeneratedFlow(std::shared_ptr<DecisionStrategy> strategy)
        : strategy_(std::move(strategy)) {}

    void run(FlowContext& context) {
        if (strategy_) strategy_->decide(context);
${calls || "        return;"}
    }

private:
    std::shared_ptr<DecisionStrategy> strategy_;
};

${methods}
`;
  }

  if (blueprint === "command-pipeline") {
    return `#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

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
`;
  }

  return `#include <string>
#include <unordered_map>
#include <vector>

struct FlowContext {
    std::unordered_map<std::string, std::string> data;
    std::vector<std::string> audit;
};

${methods}
void run_flow(FlowContext& context) {
${calls || "    return;"}
}
`;
}
