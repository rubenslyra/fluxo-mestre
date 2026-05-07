import { useMemo, useState } from "react";
import { CHALLENGES, type Challenge, type Difficulty } from "./challenges";

const STORAGE_KEY = "flowchart-challenges-progress-v1";

type Progress = Record<string, { stepIdx: number; notes: string; revealed: boolean; done: boolean }>;

function loadProgress(): Progress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

const diffColor: Record<Difficulty, string> = {
  iniciante: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  intermediário: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  avançado: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

export function CriticalThinkingLab() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [activeId, setActiveId] = useState<string>(CHALLENGES[0].id);
  const [filter, setFilter] = useState<"todos" | Difficulty>("todos");

  const persist = (next: Progress) => {
    setProgress(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const getProg = (id: string) =>
    progress[id] ?? { stepIdx: 0, notes: "", revealed: false, done: false };

  const updateProg = (id: string, patch: Partial<Progress[string]>) => {
    persist({ ...progress, [id]: { ...getProg(id), ...patch } });
  };

  const filtered = useMemo(
    () => (filter === "todos" ? CHALLENGES : CHALLENGES.filter((c) => c.difficulty === filter)),
    [filter],
  );

  const active = CHALLENGES.find((c) => c.id === activeId) ?? CHALLENGES[0];
  const prog = getProg(active.id);
  const totalDone = Object.values(progress).filter((p) => p.done).length;

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Desafios de Pensamento Lógico
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalDone} de {CHALLENGES.length} concluídos
          </p>
          <div className="mt-3 flex gap-1">
            {(["todos", "iniciante", "intermediário", "avançado"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium capitalize transition ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <ul className="divide-y divide-border">
          {filtered.map((c) => {
            const p = getProg(c.id);
            return (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                    activeId === c.id ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{c.title}</span>
                    {p.done && (
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${diffColor[c.difficulty]}`}>
                      {c.difficulty}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{c.category}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-8">
          <header>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${diffColor[active.difficulty]}`}>
                {active.difficulty}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {active.category}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{active.title}</h1>
            <p className="mt-2 text-sm font-medium text-primary">
              Conceito lógico: {active.logicConcept}
            </p>
          </header>

          {/* Cenário */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Cenário
            </h3>
            <p className="text-sm leading-relaxed">{active.scenario}</p>
          </section>

          {/* Por que isso importa — resposta ao aluno crítico */}
          <section className="rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                Por que estudar isso? (para o aluno cético)
              </h3>
            </div>
            <p className="text-sm leading-relaxed font-medium">{active.whyItMatters}</p>
            <div className="mt-4 rounded-lg bg-background/60 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Habilidade transferível
              </p>
              <p className="mt-1 text-sm italic">{active.transferableSkill}</p>
            </div>
          </section>

          {/* Onde isso aparece no mercado */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Onde isso aparece no mundo real
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {active.realWorldApplications.map((app, i) => (
                <li key={i} className="flex gap-2 rounded-md bg-muted/40 p-2 text-sm">
                  <span className="text-primary">→</span>
                  <span className="leading-snug">{app}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Perguntas críticas dos alunos + respostas prontas */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Quando o aluno questionar... (respostas prontas)
            </h3>
            <div className="space-y-3">
              {active.studentObjections.map((obj, i) => (
                <details
                  key={i}
                  className="group rounded-lg border border-border bg-muted/20 p-3 open:bg-muted/40"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold">
                    <span className="mr-2 text-primary">💬</span>
                    {obj.question}
                    <span className="float-right text-xs text-muted-foreground group-open:hidden">
                      ver resposta
                    </span>
                  </summary>
                  <p className="mt-2 border-l-2 border-primary pl-3 text-sm leading-relaxed text-foreground/90">
                    {obj.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Perguntas socráticas */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Provocações para destravar o pensamento
            </h3>
            <ul className="space-y-2">
              {active.provocations.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="font-mono text-primary">?{i + 1}</span>
                  <span className="leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Roteiro guiado */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Roteiro: Passo {Math.min(prog.stepIdx + 1, active.steps.length)} de {active.steps.length}
              </h3>
              <div className="flex h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-primary transition-all"
                  style={{ width: `${((prog.stepIdx) / active.steps.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {active.steps.map((s, i) => {
                const isCurrent = i === prog.stepIdx;
                const isDone = i < prog.stepIdx;
                return (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 transition ${
                      isCurrent
                        ? "border-primary bg-primary/5"
                        : isDone
                        ? "border-border bg-muted/30 opacity-70"
                        : "border-border opacity-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? "✓" : i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{s.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{s.prompt}</p>
                        {isCurrent && s.hint && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
                              Ver dica
                            </summary>
                            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                disabled={prog.stepIdx === 0}
                onClick={() => updateProg(active.id, { stepIdx: Math.max(0, prog.stepIdx - 1) })}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={prog.stepIdx >= active.steps.length}
                onClick={() => updateProg(active.id, { stepIdx: prog.stepIdx + 1 })}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                Próximo passo
              </button>
            </div>
          </section>

          {/* Anotações do aluno */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Suas anotações (rascunho do raciocínio)
            </h3>
            <textarea
              value={prog.notes}
              onChange={(e) => updateProg(active.id, { notes: e.target.value })}
              placeholder="Escreva aqui as premissas que você identificou, as decisões e o esboço textual do fluxo antes de desenhar no editor..."
              rows={6}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* Premissas e decisões esperadas */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Premissas dadas
              </h3>
              <ul className="space-y-1 text-sm">
                {active.premises.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">•</span>{p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Decisões esperadas
              </h3>
              <ul className="space-y-1 text-sm font-mono">
                {active.expectedDecisions.map((d, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">◇</span>{d}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Armadilhas */}
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Armadilhas comuns
            </h3>
            <ul className="space-y-1 text-sm">
              {active.pitfalls.map((p, i) => (
                <li key={i} className="flex gap-2"><span>⚠️</span>{p}</li>
              ))}
            </ul>
          </section>

          {/* Solução de referência */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Fluxo de referência
              </h3>
              <button
                onClick={() => updateProg(active.id, { revealed: !prog.revealed })}
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
              >
                {prog.revealed ? "Ocultar" : "Revelar"}
              </button>
            </div>
            {prog.revealed ? (
              <ol className="space-y-1 rounded-md bg-muted/50 p-4 font-mono text-xs">
                {active.referenceFlow.map((line, i) => (
                  <li key={i} className="leading-relaxed">
                    <span className="mr-2 text-muted-foreground">{String(i + 1).padStart(2, "0")}.</span>
                    {line}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Tente esboçar o fluxo no editor antes de revelar a referência. O processo de errar e ajustar é parte do aprendizado.
              </p>
            )}
          </section>

          {/* Concluir */}
          <section className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
            <div>
              <p className="text-sm font-semibold">Pronto para o próximo desafio?</p>
              <p className="text-xs text-muted-foreground">
                Marque como concluído quando tiver desenhado o fluxo no editor e comparado com a referência.
              </p>
            </div>
            <button
              onClick={() => updateProg(active.id, { done: !prog.done })}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                prog.done
                  ? "bg-emerald-500 text-white hover:opacity-90"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {prog.done ? "✓ Concluído" : "Marcar como concluído"}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
