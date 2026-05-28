import type { SymbolKind } from "./symbols";

export interface GeneratedFlow {
  title: string;
  summary: string;
  nodes: Array<{
    id: string;
    kind: SymbolKind;
    label: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
}

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function getAssignmentValue(source: string, name: string) {
  const match = source.match(new RegExp(`${name}\\s*=\\s*([^\\n#]+)`));
  return match?.[1]?.trim();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

interface RangedInput {
  name: string;
  min: string;
  max: string;
}

function cleanInputName(value: string) {
  const segments = value
    .split(":")
    .map((part) => part.trim())
    .filter(Boolean);
  const raw = segments[segments.length - 1] ?? value;
  return raw
    .replace(/^[\s*-]*(?:\d+[.)]\s*)?/, "")
    .replace(/^(sendo|com|campo|nota|avaliacao)\s+/i, "")
    .replace(/[.,]$/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function extractRangedInputs(description: string): RangedInput[] {
  const chunks = description.split(/[;\n]+/);
  const inputs: RangedInput[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const range = chunk.match(/:\s*(\d+(?:[,.]\d+)?)\s*a\s*(\d+(?:[,.]\d+)?)/i);
    if (!range || typeof range.index !== "number") continue;

    const name = cleanInputName(chunk.slice(0, range.index));
    if (!name) continue;

    const key = normalizeText(name);
    if (seen.has(key)) continue;
    seen.add(key);
    inputs.push({
      name,
      min: range[1]?.replace(",", ".") ?? "0",
      max: range[2]?.replace(",", ".") ?? "0",
    });
  }

  return inputs;
}

function isGradeRegistration(description: string, inputs: RangedInput[]) {
  const lower = normalizeText(description);
  return (
    inputs.length >= 2 &&
    hasAny(lower, ["nota", "notas", "avaliacao", "avaliacoes", "prova", "modulo", "curso"])
  );
}

function buildGradeRegistrationFlow(inputs: RangedInput[]): GeneratedFlow {
  const nodes: GeneratedFlow["nodes"] = [
    { id: "n1", kind: "terminator", label: "Inicio" },
    { id: "n2", kind: "preparation", label: "Inicializar registros" },
    { id: "n3", kind: "display", label: "Mostrar menu principal" },
    { id: "n4", kind: "manual", label: "Ler opcao do tester" },
    { id: "n5", kind: "decision", label: "Opcao 1: teste manual?" },
    { id: "n6", kind: "preparation", label: "i = 1; limite = 5" },
    { id: "n7", kind: "decision", label: "i <= 5?" },
    { id: "n8", kind: "manual", label: "Ler id do aluno" },
  ];
  const edges: GeneratedFlow["edges"] = [
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3" },
    { from: "n3", to: "n4" },
    { from: "n4", to: "n5" },
    { from: "n5", to: "n6", label: "Sim" },
    { from: "n6", to: "n7" },
    { from: "n7", to: "n8", label: "Sim" },
  ];

  let nextId = 9;
  let previousValidPath = "n8";

  for (const input of inputs) {
    const manualId = `n${nextId++}`;
    const decisionId = `n${nextId++}`;
    const errorId = `n${nextId++}`;
    const range = `${input.min} a ${input.max}`;

    nodes.push({ id: manualId, kind: "manual", label: `Ler ${input.name} (${range})` });
    nodes.push({ id: decisionId, kind: "decision", label: `${input.name} valida?` });
    nodes.push({ id: errorId, kind: "display", label: `Avisar faixa ${range}` });

    edges.push({
      from: previousValidPath,
      to: manualId,
      label: previousValidPath === "n8" ? undefined : "Sim",
    });
    edges.push({ from: manualId, to: decisionId });
    edges.push({ from: decisionId, to: errorId, label: "Nao" });
    edges.push({ from: errorId, to: manualId });

    previousValidPath = decisionId;
  }

  const calculateId = `n${nextId++}`;
  const registerId = `n${nextId++}`;
  const displayId = `n${nextId++}`;
  const advanceId = `n${nextId++}`;
  const manualSummaryId = `n${nextId++}`;
  const seedDecisionId = `n${nextId++}`;
  const seedId = `n${nextId++}`;
  const seedCalcId = `n${nextId++}`;
  const seedStoreId = `n${nextId++}`;
  const seedSummaryId = `n${nextId++}`;
  const helpDecisionId = `n${nextId++}`;
  const helpId = `n${nextId++}`;
  const referencesId = `n${nextId++}`;
  const exitDecisionId = `n${nextId++}`;
  const invalidId = `n${nextId++}`;
  const endId = `n${nextId++}`;

  nodes.push({ id: calculateId, kind: "process", label: "Calcular nota_final" });
  nodes.push({ id: registerId, kind: "data", label: "Registrar aluno, notas e total" });
  nodes.push({ id: displayId, kind: "display", label: "Exibir nota do aluno" });
  nodes.push({ id: advanceId, kind: "process", label: "i = i + 1" });
  nodes.push({ id: manualSummaryId, kind: "display", label: "Exibir resumo dos 5" });
  nodes.push({ id: seedDecisionId, kind: "decision", label: "Opcao 2: seed 100?" });
  nodes.push({ id: seedId, kind: "process", label: "Gerar 100 alunos seed" });
  nodes.push({ id: seedCalcId, kind: "process", label: "Calcular notas geradas" });
  nodes.push({ id: seedStoreId, kind: "data", label: "Salvar base de teste" });
  nodes.push({ id: seedSummaryId, kind: "display", label: "Exibir resumo do seed" });
  nodes.push({ id: helpDecisionId, kind: "decision", label: "Opcao 3: ajuda?" });
  nodes.push({ id: helpId, kind: "display", label: "Mostrar ajuda da aplicacao" });
  nodes.push({ id: referencesId, kind: "document", label: "Listar referencias e fontes" });
  nodes.push({ id: exitDecisionId, kind: "decision", label: "Opcao 4: sair?" });
  nodes.push({ id: invalidId, kind: "display", label: "Avisar opcao invalida" });
  nodes.push({ id: endId, kind: "terminator", label: "Fim" });

  edges.push({ from: previousValidPath, to: calculateId, label: "Sim" });
  edges.push({ from: calculateId, to: registerId });
  edges.push({ from: registerId, to: displayId });
  edges.push({ from: displayId, to: advanceId });
  edges.push({ from: advanceId, to: "n7" });
  edges.push({ from: "n7", to: manualSummaryId, label: "Nao" });
  edges.push({ from: manualSummaryId, to: "n3" });
  edges.push({ from: "n5", to: seedDecisionId, label: "Nao" });
  edges.push({ from: seedDecisionId, to: seedId, label: "Sim" });
  edges.push({ from: seedId, to: seedCalcId });
  edges.push({ from: seedCalcId, to: seedStoreId });
  edges.push({ from: seedStoreId, to: seedSummaryId });
  edges.push({ from: seedSummaryId, to: "n3" });
  edges.push({ from: seedDecisionId, to: helpDecisionId, label: "Nao" });
  edges.push({ from: helpDecisionId, to: helpId, label: "Sim" });
  edges.push({ from: helpId, to: referencesId });
  edges.push({ from: referencesId, to: "n3" });
  edges.push({ from: helpDecisionId, to: exitDecisionId, label: "Nao" });
  edges.push({ from: exitDecisionId, to: endId, label: "Sim" });
  edges.push({ from: exitDecisionId, to: invalidId, label: "Nao" });
  edges.push({ from: invalidId, to: "n3" });

  return {
    title: "Sistema de notas do modulo",
    summary:
      "Fluxo com menu para o tester escolher teste manual com 5 alunos, seed com 100 alunos, ajuda ou sair. No teste manual, cada aluno e cada nota sao lidos separadamente, com validacao de faixa antes do calculo e registro da nota final.",
    nodes,
    edges,
  };
}

function codeToFlow(description: string): GeneratedFlow {
  const lower = normalizeText(description);
  const quantity = getAssignmentValue(description, "quantidade_alunos") ?? "N";
  const hasRandomGrades = lower.includes("random.uniform");
  const hasStudentsList = lower.includes("alunos.append") || lower.includes("alunos = []");
  const hasPrintLoop = lower.includes("enumerate(alunos)") || lower.includes("print(");

  if (hasRandomGrades && hasStudentsList) {
    return {
      title: "Geracao de notas de alunos",
      summary:
        "O fluxo inicializa a quantidade de alunos e a lista principal. Depois repete a geracao das notas para cada aluno, armazena os dados e percorre a lista para exibir o resultado.",
      nodes: [
        { id: "n1", kind: "terminator", label: "Inicio" },
        { id: "n2", kind: "preparation", label: `quantidade = ${quantity}; alunos = []` },
        { id: "n3", kind: "decision", label: "Ainda ha aluno?" },
        { id: "n4", kind: "process", label: "Gerar AOP1, AOP2 e AOP3" },
        { id: "n5", kind: "process", label: "Gerar provas PR e REC" },
        { id: "n6", kind: "process", label: "Montar notas_do_aluno" },
        { id: "n7", kind: "process", label: "Adicionar notas em alunos" },
        { id: "n8", kind: "process", label: "Avancar para proximo aluno" },
        {
          id: "n9",
          kind: "decision",
          label: hasPrintLoop ? "Ainda ha nota para exibir?" : "Exibir dados?",
        },
        { id: "n10", kind: "display", label: "Exibir aluno e notas" },
        { id: "n11", kind: "process", label: "Avancar exibicao" },
        { id: "n12", kind: "terminator", label: "Fim" },
      ],
      edges: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4", label: "Sim" },
        { from: "n4", to: "n5" },
        { from: "n5", to: "n6" },
        { from: "n6", to: "n7" },
        { from: "n7", to: "n8" },
        { from: "n8", to: "n3" },
        { from: "n3", to: "n9", label: "Nao" },
        { from: "n9", to: "n10", label: "Sim" },
        { from: "n10", to: "n11" },
        { from: "n11", to: "n9" },
        { from: "n9", to: "n12", label: "Nao" },
      ],
    };
  }

  return genericFlow(description);
}

function genericFlow(description: string): GeneratedFlow {
  const lower = normalizeText(description);
  const hasLoop = hasAny(lower, ["para cada", "for ", "while ", "enquanto", "repita", "repet"]);
  const hasDecision = hasAny(lower, [
    " se ",
    "if ",
    "senao",
    "caso",
    "condicao",
    "maior",
    "menor",
    ">=",
    "<=",
    "==",
  ]);
  const hasInput = hasAny(lower, ["ler", "leia", "input", "digite", "receber", "entrada"]);
  const hasOutput = hasAny(lower, ["exibir", "mostrar", "print", "imprimir", "saida"]);

  const nodes: GeneratedFlow["nodes"] = [
    { id: "n1", kind: "terminator", label: "Inicio" },
    {
      id: "n2",
      kind: hasInput ? "manual" : "preparation",
      label: hasInput ? "Ler dados de entrada" : "Preparar dados iniciais",
    },
  ];
  const edges: GeneratedFlow["edges"] = [{ from: "n1", to: "n2" }];

  if (hasLoop) {
    nodes.push({ id: "n3", kind: "decision", label: "Repetir processamento?" });
    nodes.push({ id: "n4", kind: "process", label: "Processar item atual" });
    nodes.push({ id: "n5", kind: "process", label: "Avancar repeticao" });
    edges.push({ from: "n2", to: "n3" });
    edges.push({ from: "n3", to: "n4", label: "Sim" });
    edges.push({ from: "n4", to: "n5" });
    edges.push({ from: "n5", to: "n3" });
  }

  if (hasDecision) {
    const decisionId = hasLoop ? "n6" : "n3";
    const yesId = hasLoop ? "n7" : "n4";
    const noId = hasLoop ? "n8" : "n5";
    nodes.push({ id: decisionId, kind: "decision", label: "Condicao atendida?" });
    nodes.push({ id: yesId, kind: "process", label: "Executar caminho Sim" });
    nodes.push({ id: noId, kind: "process", label: "Executar caminho Nao" });
    edges.push({ from: hasLoop ? "n3" : "n2", to: decisionId, label: hasLoop ? "Nao" : undefined });
    edges.push({ from: decisionId, to: yesId, label: "Sim" });
    edges.push({ from: decisionId, to: noId, label: "Nao" });
  }

  const lastIds = nodes.slice(-2).map((node) => node.id);
  const outputId = `n${nodes.length + 1}`;
  const endId = `n${nodes.length + 2}`;
  nodes.push({
    id: outputId,
    kind: hasOutput ? "display" : "data",
    label: hasOutput ? "Exibir resultado" : "Registrar resultado",
  });
  nodes.push({ id: endId, kind: "terminator", label: "Fim" });

  if (hasDecision) {
    lastIds.forEach((id) => edges.push({ from: id, to: outputId }));
  } else {
    edges.push({ from: hasLoop ? "n3" : "n2", to: outputId, label: hasLoop ? "Nao" : undefined });
  }
  edges.push({ from: outputId, to: endId });

  return {
    title: "Fluxograma assistido",
    summary:
      "Fluxo gerado localmente a partir de padroes do enunciado. Revise os rotulos para ajustar detalhes de regra de negocio.",
    nodes,
    edges,
  };
}

export function generateLocalFlowchart(description: string): GeneratedFlow {
  const rangedInputs = extractRangedInputs(description);
  if (isGradeRegistration(description, rangedInputs)) {
    return buildGradeRegistrationFlow(rangedInputs);
  }

  if (/[#\n]|for\s+.+\s+in\s+|while\s+|print\s*\(|=\s*.+/i.test(description)) {
    return codeToFlow(description);
  }

  return genericFlow(description);
}
