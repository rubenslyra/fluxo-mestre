import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const SYMBOL_KINDS = [
  "terminator",
  "process",
  "decision",
  "data",
  "predefined",
  "preparation",
  "document",
  "manual",
  "display",
  "connector",
] as const;

const FlowSchema = z.object({
  title: z.string().describe("Título curto do fluxograma"),
  summary: z.string().describe("Resumo da estratégia adotada (2-4 frases) explicando como o problema foi modelado"),
  nodes: z
    .array(
      z.object({
        id: z.string().describe("Identificador curto único, ex: n1, n2..."),
        kind: z.enum(SYMBOL_KINDS).describe("Tipo do símbolo ISO 5807"),
        label: z.string().describe("Texto curto do símbolo (máx ~40 chars)"),
      }),
    )
    .min(2)
    .max(40),
  edges: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        label: z.string().optional().describe("Rótulo da seta (ex: Sim, Não). Use APENAS em saídas de Decisão."),
      }),
    )
    .min(1)
    .max(80),
});

export type GeneratedFlow = z.infer<typeof FlowSchema>;

const SYSTEM_PROMPT = `Você é um especialista em ISO 5807 e em modelagem de algoritmos para alunos iniciantes de lógica de programação.
Recebe a descrição de um problema (em português) e devolve a ESTRUTURA de um fluxograma didático.

Símbolos disponíveis (use os "kinds" exatamente assim):
- terminator: Início ou Fim. SEMPRE use para começar ("Início") e terminar ("Fim").
- process: operação, atribuição, cálculo (ex: "MM = AOP1+AOP2+AOP3+PR").
- decision: desvio condicional. SEMPRE tem 2 saídas com label "Sim" e "Não".
- data: entrada/saída genérica de dados.
- manual: leitura interativa do usuário (input via teclado).
- display: exibir resultado na tela.
- document: saída em documento/relatório.
- predefined: chamada de sub-rotina/função.
- preparation: inicialização de variáveis, contadores, laços (ex: "i = 0; total = 0").
- connector: conector quando o fluxo cruza páginas/seções.

Regras OBRIGATÓRIAS:
1. SEMPRE comece com 1 terminator com label "Início" e termine com 1 terminator com label "Fim".
2. TODA decisão (kind=decision) deve ter EXATAMENTE 2 arestas de saída, uma com label "Sim" e outra com "Não".
3. Não deixe nó desconectado. Cada nó (exceto Início) tem ao menos 1 entrada; cada nó (exceto Fim) tem ao menos 1 saída.
4. Para LAÇOS (repetição N vezes, "para cada aluno"), use preparation para inicializar o contador, decision para a condição de continuidade, process para incrementar, e a aresta de "Sim/continua" volta para o corpo do laço.
5. Labels curtos (idealmente <40 chars). Use português claro.
6. Prefira fluxo de cima para baixo. ids curtos sequenciais (n1, n2...).
7. Se o problema pedir leitura de várias notas/valores do usuário, use manual para CADA leitura ou agrupe se forem da mesma natureza, deixando o didático em primeiro lugar.
8. Se houver cálculo de média, condições compostas (>= 7.0 OU >= 5.0), modele cada decisão separadamente para o aluno enxergar a lógica.

Responda APENAS com o objeto estruturado pedido. NÃO inclua coordenadas (x,y) — elas serão calculadas depois.`;

export const generateFlowchart = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    return z.object({ description: z.string().min(10).max(8000) }).parse(input);
  })
  .handler(async ({ data }) => {
    try {
      const key = process.env.LOVABLE_API_KEY ?? process.env.AI_GATEWAY_API_KEY;
      if (!key) {
        return {
          ok: false as const,
          error:
            "IA não configurada neste ambiente. Configure LOVABLE_API_KEY (ou AI_GATEWAY_API_KEY) no servidor e reinicie o app.",
        };
      }

      const gateway = createLovableAiGatewayProvider(key);
      const model = gateway("google/gemini-3-flash-preview");

      const { experimental_output } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: `Problema:\n\n${data.description}\n\nGere o fluxograma estruturado conforme as regras.`,
        experimental_output: Output.object({ schema: FlowSchema }),
      });
      return { ok: true as const, flow: experimental_output };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode;
      if (status === 429) {
        return { ok: false as const, error: "Limite de requisições atingido. Tente novamente em alguns instantes." };
      }
      if (status === 402) {
        return { ok: false as const, error: "Créditos da IA esgotados. Adicione créditos no workspace para continuar." };
      }
      return { ok: false as const, error: `Falha ao gerar fluxograma: ${msg}` };
    }
  });
