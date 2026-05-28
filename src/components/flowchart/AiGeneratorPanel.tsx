import { useEffect, useMemo, useState } from "react";
import {
  APP_SETTINGS_CHANGED_EVENT,
  defaultAppSettings,
  loadAppSettings,
  type AppSettings,
} from "../settings/appSettings";
import { layoutGeneratedFlow } from "./aiLayout";
import { generateConnectedFlowchart } from "./externalAi";
import { generateLocalFlowchart } from "./flowGenerator";
import type { FlowDoc } from "./types";
import {
  addTemplate,
  clearHistory,
  diffFlows,
  exportTemplatesJson,
  importTemplatesJson,
  loadHistory,
  loadTemplates,
  pushHistory,
  removeHistory,
  removeTemplate,
  type AiHistoryEntry,
  type PromptTemplate,
} from "./aiHistory";
import { validateFlow } from "./validation";

const GRADE_REGISTRATION_PROMPT = `Modele um sistema de registro e apuracao da nota final de estudantes em um modulo de curso.

O usuario tester deve iniciar pelo menu principal e escolher uma das opcoes abaixo:
1 - Iniciar teste manual com 5 alunos, preenchendo um aluno por vez.
2 - Gerar uma base seed com 100 alunos para teste automatico.
3 - Abrir a ajuda da aplicacao, com informacoes de uso, referencias e fontes.
4 - Sair do sistema.

No teste manual, para cada um dos 5 alunos, o sistema deve ler a identificacao do estudante e depois ler cada nota em uma entrada separada:
- avaliacao_1: 0 a 1 ponto;
- avaliacao_2: 0 a 2 pontos;
- avaliacao_3: 0 a 1 ponto;
- prova_regular: 0 a 6 pontos.

Cada entrada informada pelo usuario deve ser representada por um simbolo Manual separado. Valide cada nota logo apos a leitura; se estiver fora da faixa permitida, exiba uma mensagem de erro e solicite novamente a mesma nota.

Quando as quatro notas forem validas, calcule nota_final = avaliacao_1 + avaliacao_2 + avaliacao_3 + prova_regular. Registre a identificacao do aluno, as quatro notas e a nota_final. Ao final do teste manual, exiba um resumo dos 5 alunos registrados.`;

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (doc: FlowDoc, mode: "replace" | "merge") => void;
}

type Tab = "generate" | "templates" | "history";

export function AiGeneratorPanel({ open, onClose, onApply }: Props) {
  const [tab, setTab] = useState<Tab>("generate");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [pending, setPending] = useState<FlowDoc | null>(null);
  const [pendingTitle, setPendingTitle] = useState<string>("");
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [history, setHistory] = useState<AiHistoryEntry[]>([]);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    if (open) {
      setTemplates(loadTemplates());
      setHistory(loadHistory());
      setAppSettings(loadAppSettings());
    }
  }, [open]);

  useEffect(() => {
    const syncSettings = () => setAppSettings(loadAppSettings());
    window.addEventListener(APP_SETTINGS_CHANGED_EVENT, syncSettings);
    return () => window.removeEventListener(APP_SETTINGS_CHANGED_EVENT, syncSettings);
  }, []);

  const validation = useMemo(() => (pending ? validateFlow(pending) : []), [pending]);
  const errors = validation.filter((v) => v.level === "error");
  const warnings = validation.filter((v) => v.level === "warning");

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
      const settings = loadAppSettings();
      setAppSettings(settings);
      const flow =
        settings.ai.mode === "external"
          ? await generateConnectedFlowchart(description.trim(), settings)
          : generateLocalFlowchart(description.trim());
      const doc = layoutGeneratedFlow(flow);
      setPending(doc);
      setPendingTitle(flow.title);
      setSummary(`${flow.title}${flow.summary ? " — " + flow.summary : ""}`);
      const next = pushHistory({
        description: description.trim(),
        title: flow.title,
        summary: flow.summary,
        flow: doc,
      });
      setHistory(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const apply = (mode: "replace" | "merge", doc: FlowDoc | null = pending) => {
    if (!doc) return;
    onApply(doc, mode);
    onClose();
  };

  const onSaveTemplate = () => {
    if (description.trim().length < 10) {
      setError("Escreva o enunciado antes de salvar como template.");
      return;
    }
    const name = templateName.trim() || pendingTitle || "Meu template";
    const next = addTemplate(name, description.trim());
    setTemplates(next);
    setTemplateName("");
    setTab("templates");
  };

  const applyTemplate = (t: PromptTemplate) => {
    setDescription(t.description);
    setTab("generate");
  };

  const removeTpl = (id: string) => {
    if (!confirm("Excluir este template?")) return;
    setTemplates(removeTemplate(id));
  };

  const a = history.find((h) => h.id === compareIds[0]) ?? null;
  const b = history.find((h) => h.id === compareIds[1]) ?? null;
  const compareDiff = a && b ? diffFlows(a.flow, b.flow) : null;
  const isExternalMode = appSettings.ai.mode === "external";
  const aiModeDescription = isExternalMode
    ? `API externa: ${appSettings.ai.provider} · ${appSettings.ai.model}`
    : "Geração local, sem conta externa, sem chave e sem envio de dados.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-lg font-bold">🤖 Agente IA — Gerador de Fluxograma</h2>
            <p className="text-xs text-muted-foreground">{aiModeDescription}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="Fechar">
            ✕
          </button>
        </header>

        <nav className="flex shrink-0 gap-1 border-b border-border bg-muted/40 px-3 py-1.5">
          {(
            [
              ["generate", "✨ Gerar"],
              ["templates", `📚 Templates (${templates.length})`],
              ["history", `🕘 Histórico (${history.length})`],
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                tab === k
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-card/60"
              }`}
            >
              {l}
            </button>
          ))}
        </nav>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {tab === "generate" && (
            <>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Descrição / enunciado do problema
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDescription(GRADE_REGISTRATION_PROMPT)}
                      className="text-[11px] text-primary hover:underline"
                      type="button"
                    >
                      Usar exemplo de notas
                    </button>
                  </div>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={10}
                  placeholder={GRADE_REGISTRATION_PROMPT}
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Dica: descreva entradas, regras de decisão (se/senão), laços e saídas.
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={templateName}
                    onChange={(event) => setTemplateName(event.target.value)}
                    placeholder="Nome do template"
                    className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={onSaveTemplate}
                    className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                    type="button"
                  >
                    Salvar template
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                      disabled={errors.length > 0}
                      className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
                      title={errors.length > 0 ? "Corrija os erros ISO 5807 antes de aplicar" : ""}
                    >
                      Aplicar (substituir)
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
                <div className="space-y-2">
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ Pronto: {pending.nodes.length} símbolos · {pending.edges.length} conexões
                    </p>
                    {summary && <p className="mt-1 text-xs text-muted-foreground">{summary}</p>}
                  </div>

                  <div
                    className={`rounded-lg border p-3 text-xs ${
                      errors.length > 0
                        ? "border-destructive/50 bg-destructive/5"
                        : warnings.length > 0
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-emerald-500/40 bg-emerald-500/5"
                    }`}
                  >
                    <p className="mb-1 font-bold uppercase tracking-widest">
                      Validação ISO 5807 ·{" "}
                      {errors.length > 0
                        ? `${errors.length} erro(s)`
                        : warnings.length > 0
                          ? `${warnings.length} aviso(s)`
                          : "íntegro"}
                    </p>
                    {validation.length === 0 ? (
                      <p className="text-muted-foreground">
                        Tem Início/Fim, decisões com Sim/Não e nenhuma conexão inconsistente.
                      </p>
                    ) : (
                      <ul className="max-h-32 space-y-1 overflow-y-auto">
                        {validation.map((v, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span
                              className={
                                v.level === "error" ? "text-destructive" : "text-amber-600"
                              }
                            >
                              ●
                            </span>
                            <span>{v.msg}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "templates" && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Templates salvos no navegador. Use para repetir enunciados (AOP1/AOP2/AOP3 UVV)
                  sem reescrever.
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const json = exportTemplatesJson();
                      const blob = new Blob([json], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const aEl = document.createElement("a");
                      aEl.href = url;
                      aEl.download = `fluxolab-templates-${new Date().toISOString().slice(0, 10)}.json`;
                      aEl.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted"
                  >
                    ⤓ Exportar JSON
                  </button>
                  <label className="cursor-pointer rounded border border-border px-2 py-1 text-[11px] hover:bg-muted">
                    ⤒ Importar JSON
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          try {
                            const mode = confirm(
                              "OK = Mesclar com seus templates atuais\nCancelar = Substituir tudo",
                            )
                              ? "merge"
                              : "replace";
                            const next = importTemplatesJson(String(reader.result), mode);
                            setTemplates(next);
                          } catch {
                            alert("Arquivo de templates inválido.");
                          }
                        };
                        reader.readAsText(f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
              {templates.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhum template ainda. Vá em <b>Gerar</b> e clique em <b>Salvar como template</b>.
                </p>
              )}
              {templates.map((t) => (
                <div key={t.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold">{t.name}</h4>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => applyTemplate(t)}
                        className="rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90"
                      >
                        Usar
                      </button>
                      <button
                        onClick={() => removeTpl(t.id)}
                        className="rounded border border-border px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Últimas {history.length} gerações. Selecione 2 para comparar.
                </p>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Limpar todo o histórico?")) {
                        setHistory(clearHistory());
                        setCompareIds([null, null]);
                      }
                    }}
                    className="text-[11px] text-destructive hover:underline"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>

              {history.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma geração ainda. Gere um fluxograma para começar o histórico.
                </p>
              )}

              {history.length >= 2 && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 p-2 text-[11px]">
                  <span className="font-semibold">Passo a passo:</span>
                  <button
                    onClick={() => {
                      // Step backward: select previous pair (older A, newer B)
                      const idxB = compareIds[1]
                        ? history.findIndex((h) => h.id === compareIds[1])
                        : 0;
                      const newB = Math.min(history.length - 2, Math.max(0, idxB + 1));
                      setCompareIds([history[newB + 1].id, history[newB].id]);
                    }}
                    className="rounded border border-border px-2 py-0.5 hover:bg-card"
                  >
                    ← versão anterior
                  </button>
                  <button
                    onClick={() => {
                      const idxB = compareIds[1]
                        ? history.findIndex((h) => h.id === compareIds[1])
                        : 1;
                      const newB = Math.max(0, idxB - 1);
                      const aIdx = Math.min(history.length - 1, newB + 1);
                      setCompareIds([history[aIdx].id, history[newB].id]);
                    }}
                    className="rounded border border-border px-2 py-0.5 hover:bg-card"
                  >
                    versão seguinte →
                  </button>
                  <button
                    onClick={() => setCompareIds([null, null])}
                    className="ml-auto text-destructive hover:underline"
                  >
                    limpar seleção
                  </button>
                </div>
              )}

              {compareDiff && a && b && (
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs">
                  <p className="mb-2 font-bold uppercase tracking-widest text-primary">
                    Comparação A → B
                  </p>
                  <div className="mb-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <div>
                      <span className="font-semibold">A</span>
                      <p>{new Date(a.createdAt).toLocaleString()}</p>
                      <p>
                        {a.flow.nodes.length} símbolos · {a.flow.edges.length} conexões
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold">B</span>
                      <p>{new Date(b.createdAt).toLocaleString()}</p>
                      <p>
                        {b.flow.nodes.length} símbolos · {b.flow.edges.length} conexões
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border border-emerald-500/40 bg-emerald-500/5 p-2">
                      <p className="mb-1 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                        + Adicionados em B (
                        {compareDiff.addedNodes.length + compareDiff.addedEdges.length})
                      </p>
                      {compareDiff.addedNodes.length === 0 &&
                        compareDiff.addedEdges.length === 0 && (
                          <p className="text-[11px] text-muted-foreground">nenhum</p>
                        )}
                      <ul className="space-y-0.5 text-[11px]">
                        {compareDiff.addedNodes.map((n, i) => (
                          <li key={"an" + i} className="truncate">
                            <span className="text-emerald-700 dark:text-emerald-400">▣</span>{" "}
                            {n.label} <span className="text-muted-foreground">({n.kind})</span>
                          </li>
                        ))}
                        {compareDiff.addedEdges.map((e, i) => (
                          <li key={"ae" + i} className="truncate">
                            <span className="text-emerald-700 dark:text-emerald-400">→</span>{" "}
                            {e.from} → {e.to}
                            {e.label ? (
                              <span className="text-muted-foreground"> [{e.label}]</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded border border-destructive/40 bg-destructive/5 p-2">
                      <p className="mb-1 text-[10px] font-bold uppercase text-destructive">
                        − Removidos de A (
                        {compareDiff.removedNodes.length + compareDiff.removedEdges.length})
                      </p>
                      {compareDiff.removedNodes.length === 0 &&
                        compareDiff.removedEdges.length === 0 && (
                          <p className="text-[11px] text-muted-foreground">nenhum</p>
                        )}
                      <ul className="space-y-0.5 text-[11px]">
                        {compareDiff.removedNodes.map((n, i) => (
                          <li key={"rn" + i} className="truncate">
                            <span className="text-destructive">▣</span> {n.label}{" "}
                            <span className="text-muted-foreground">({n.kind})</span>
                          </li>
                        ))}
                        {compareDiff.removedEdges.map((e, i) => (
                          <li key={"re" + i} className="truncate">
                            <span className="text-destructive">→</span> {e.from} → {e.to}
                            {e.label ? (
                              <span className="text-muted-foreground"> [{e.label}]</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {compareDiff.keptNodes.length} símbolo(s) mantidos entre as versões.
                  </p>
                </div>
              )}

              {history.map((h) => {
                const isA = compareIds[0] === h.id;
                const isB = compareIds[1] === h.id;
                return (
                  <div
                    key={h.id}
                    className={`rounded-lg border p-3 ${
                      isA || isB ? "border-primary/60 bg-primary/5" : "border-border bg-background"
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold">{h.title}</h4>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(h.createdAt).toLocaleString()} · {h.flow.nodes.length} símbolos
                          · {h.flow.edges.length} conexões
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        <button
                          onClick={() =>
                            setCompareIds(([prevA, prevB]) => {
                              if (prevA === h.id) return [null, prevB];
                              if (prevB === h.id) return [prevA, null];
                              if (!prevA) return [h.id, prevB];
                              if (!prevB) return [prevA, h.id];
                              return [prevB, h.id];
                            })
                          }
                          className={`rounded border px-2 py-1 text-[11px] ${
                            isA || isB
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          {isA ? "A ✓" : isB ? "B ✓" : "Comparar"}
                        </button>
                        <button
                          onClick={() => apply("replace", h.flow)}
                          className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:opacity-90"
                          title="Restaurar esta versão no canvas"
                        >
                          ↺ Restaurar
                        </button>
                        <button
                          onClick={() => apply("merge", h.flow)}
                          className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted"
                        >
                          Mesclar
                        </button>
                        <button
                          onClick={() => {
                            setDescription(h.description);
                            setTab("generate");
                          }}
                          className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted"
                          title="Carregar enunciado para regenerar"
                        >
                          Replicar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Excluir esta versão do histórico?")) {
                              setHistory(removeHistory(h.id));
                              setCompareIds(([pa, pb]) => [
                                pa === h.id ? null : pa,
                                pb === h.id ? null : pb,
                              ]);
                            }
                          }}
                          className="rounded border border-border px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">
                      {h.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
