import { readStoredApiKey, type AppSettings } from "../settings/appSettings";
import { SYMBOLS, type SymbolKind } from "./symbols";
import type { GeneratedFlow } from "./flowGenerator";

const validKinds = new Set<SymbolKind>(Object.keys(SYMBOLS) as SymbolKind[]);

const systemPrompt = `Voce converte enunciados de algoritmos em fluxogramas ISO 5807.
Responda somente JSON valido, sem markdown.
Formato:
{
  "title": "titulo curto",
  "summary": "resumo curto",
  "nodes": [{"id":"n1","kind":"terminator|process|decision|data|manual|display|document|preparation|predefined|connector","label":"texto"}],
  "edges": [{"from":"n1","to":"n2","label":"Sim"}]
}
Regras:
- Inclua um terminator de Inicio e um terminator de Fim.
- Use manual para entrada manual, data para entrada/saida geral, display para exibicao.
- Decisoes devem ter rotulos de saida como Sim/Nao quando aplicavel.
- IDs precisam ser simples, estaveis e referenciados pelas arestas.`;

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function normalizeGeneratedFlow(value: unknown): GeneratedFlow {
  if (!value || typeof value !== "object") {
    throw new Error("A resposta da IA nao retornou um objeto JSON valido.");
  }
  const raw = value as Partial<GeneratedFlow>;
  if (!Array.isArray(raw.nodes) || raw.nodes.length < 2) {
    throw new Error("A resposta da IA nao trouxe simbolos suficientes.");
  }

  const seen = new Set<string>();
  const nodes: GeneratedFlow["nodes"] = raw.nodes.flatMap((node, index) => {
    if (!node || typeof node !== "object") return [];
    const partial = node as Partial<GeneratedFlow["nodes"][number]>;
    const id = String(partial.id || `n${index + 1}`).replace(/\s+/g, "_");
    const kind = validKinds.has(partial.kind as SymbolKind)
      ? (partial.kind as SymbolKind)
      : "process";
    if (seen.has(id)) return [];
    seen.add(id);
    return [
      {
        id,
        kind,
        label:
          typeof partial.label === "string" && partial.label.trim()
            ? partial.label.trim()
            : SYMBOLS[kind].defaultLabel,
      },
    ];
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: GeneratedFlow["edges"] = Array.isArray(raw.edges)
    ? raw.edges.flatMap((edge) => {
        if (!edge || typeof edge !== "object") return [];
        const partial = edge as Partial<GeneratedFlow["edges"][number]>;
        const from = typeof partial.from === "string" ? partial.from : "";
        const to = typeof partial.to === "string" ? partial.to : "";
        if (!nodeIds.has(from) || !nodeIds.has(to) || from === to) return [];
        return [
          {
            from,
            to,
            label:
              typeof partial.label === "string" && partial.label.trim()
                ? partial.label.trim()
                : undefined,
          },
        ];
      })
    : [];

  if (edges.length === 0) {
    throw new Error("A resposta da IA nao trouxe conexoes validas entre os simbolos.");
  }

  return {
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title.trim()
        : "Fluxograma gerado por API",
    summary:
      typeof raw.summary === "string" && raw.summary.trim()
        ? raw.summary.trim()
        : "Fluxo criado por provedor externo configurado localmente.",
    nodes,
    edges,
  };
}

function parseFlowResponse(text: string) {
  try {
    return normalizeGeneratedFlow(JSON.parse(extractJson(text)));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("A resposta do provedor nao estava em JSON valido.");
    }
    throw error;
  }
}

async function callOpenAiCompatible(description: string, settings: AppSettings) {
  const apiKey = readStoredApiKey(settings.ai.apiKeyStorage);
  const response = await fetch(settings.ai.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: settings.ai.model,
      temperature: settings.ai.temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: description },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Provedor externo respondeu HTTP ${response.status}.`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("O provedor externo nao retornou conteudo de chat.");
  }
  return parseFlowResponse(content);
}

async function callGemini(description: string, settings: AppSettings) {
  const apiKey = readStoredApiKey(settings.ai.apiKeyStorage);
  const endpoint = settings.ai.endpoint.replace("{model}", encodeURIComponent(settings.ai.model));
  const url = new URL(endpoint, window.location.origin);
  if (apiKey && !url.searchParams.has("key")) url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\nEnunciado:\n${description}` }] },
      ],
      generationConfig: {
        temperature: settings.ai.temperature,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini respondeu HTTP ${response.status}.`);
  }

  const payload = await response.json();
  const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Gemini nao retornou texto estruturado.");
  }
  return parseFlowResponse(content);
}

export async function generateConnectedFlowchart(
  description: string,
  settings: AppSettings,
): Promise<GeneratedFlow> {
  if (!settings.ai.endpoint.trim() || !settings.ai.model.trim()) {
    throw new Error("Configure endpoint e modelo no painel de configuracoes.");
  }

  if (settings.ai.provider === "gemini") {
    return callGemini(description, settings);
  }

  return callOpenAiCompatible(description, settings);
}
