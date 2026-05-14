import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateFlowchart } from "@/lib/flowchart-ai.functions";
import { layoutGeneratedFlow } from "./aiLayout";
import type { FlowDoc } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (doc: FlowDoc, mode: "replace" | "merge") => void;
}

const EXAMPLE = `Sistema de avaliação UVVon: ler para 100 alunos as notas AOP1 [0-1], AOP2 [0-2], AOP3 [0-1] e Prova Regular [0-6]. Calcular MM = AOP1+AOP2+AOP3+PR.
- Se MM < 3.0 → Reprovado direto.
- Se MM >= 7.0 → Aprovado.
- Senão (3.0 <= MM < 7.0) → ler nota da Prova de Recuperação [0-10] e calcular Média Geral. Se >= 5.0 → Aprovado, senão → Reprovado.
Ao final, mostrar a porcentagem de aprovados e reprovados.`;

export function AiGeneratorPanel({ open, onClose, onApply }: Props) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [pending, setPending] = useState<FlowDoc | null>(null);
  const generate = useServerFn(generateFlowchart);

  if (!open) return null;

  const onGenerate = async () => {
    setError(null);
    setSummary(null);
    setPending(null);
    if (description.trim().length < 10) {
      setError("Descreva o problema com pelo menos 10 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const res = await generate({ data: { description: description.trim() } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const doc = layoutGeneratedFlow(res.flow);
      setPending(doc);
      setSummary(`${res.flow.title}${res.flow.summary ? " — " + res.flow.summary : ""}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const apply = (mode: "replace" | "merge") => {
    if (!pending) return;
    onApply(pending, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-lg font-bold">🤖 Agente IA — Gerador de Fluxograma</h2>
            <p className="text-xs text-muted-foreground">
              Cole o enunciado do problema e a IA monta o fluxograma usando os símbolos ISO 5807.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="Fechar">✕</button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Descrição / enunciado do problema
              </label>
              <button
                onClick={() => setDescription(EXAMPLE)}
                className="text-[11px] text-primary hover:underline"
                type="button"
              >
                Carregar exemplo (AOP2 UVV)
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
              placeholder="Ex: Faça um algoritmo que leia 100 alunos, suas notas AOP1, AOP2, AOP3 e a prova regular..."
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Dica: descreva entradas, regras de decisão (se/senão), laços e saídas. Quanto mais claro o enunciado, melhor o fluxograma.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGenerate}
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Gerando…" : "✨ Gerar fluxograma"}
            </button>
            {pending && (
              <>
                <button
                  onClick={() => apply("replace")}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Aplicar (substituir canvas)
                </button>
                <button
                  onClick={() => apply("merge")}
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Mesclar com atual
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {pending && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                ✓ Pronto: {pending.nodes.length} símbolos · {pending.edges.length} conexões
              </p>
              {summary && <p className="mt-1 text-xs text-muted-foreground">{summary}</p>}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Revise a proposta antes de aplicar — você ainda poderá arrastar, editar e validar no editor.
              </p>
            </div>
          )}

          <details className="rounded-md bg-muted/40 p-3 text-xs">
            <summary className="cursor-pointer font-semibold">Como o agente funciona?</summary>
            <p className="mt-2 leading-relaxed">
              O agente usa um modelo de linguagem (Lovable AI) com saída estruturada em JSON. O prompt do sistema descreve cada símbolo ISO 5807 e impõe regras pedagógicas: sempre Início/Fim, decisões com 2 saídas Sim/Não, laços com preparation+decision, etc. O posicionamento dos símbolos é calculado por um layout em camadas top-down — você reorganiza arrastando.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
