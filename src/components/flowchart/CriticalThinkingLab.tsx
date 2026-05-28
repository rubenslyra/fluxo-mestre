import { useEffect, useMemo, useRef, useState } from "react";
import { CHALLENGES, type Challenge, type Difficulty, type StudentObjection } from "./challenges";
import {
  classifyObjection,
  SOCRATIC_PLAYBOOK,
  TAG_COLOR,
  TAG_LABEL,
  type ObjectionTag,
} from "./objectionTags";

const STORAGE_KEY = "flowchart-challenges-progress-v1";
const OBJ_OVERRIDE_KEY = "flowchart-objection-overrides-v1";

type Progress = Record<
  string,
  { stepIdx: number; notes: string; revealed: boolean; done: boolean }
>;
// Por desafio: lista completa que substitui as objeções padrão (quando definida).
type ObjectionOverrides = Record<string, StudentObjection[]>;

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore invalid or unavailable local storage data.
  }
  return fallback;
}

const diffColor: Record<Difficulty, string> = {
  iniciante: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  intermediário: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  avançado: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

function getEffectiveObjections(c: Challenge, overrides: ObjectionOverrides): StudentObjection[] {
  return overrides[c.id] ?? c.studentObjections;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]!,
  );
}

type PrintOptions = {
  paper: "A4" | "Letter";
  margin: "estreita" | "normal" | "larga";
  separateSections: boolean;
};

const MARGIN_CSS: Record<PrintOptions["margin"], string> = {
  estreita: "12mm",
  normal: "20mm",
  larga: "30mm",
};

function exportPrintable(c: Challenge, objections: StudentObjection[], opts: PrintOptions) {
  const pageBreakObj = opts.separateSections
    ? "page-break-before:always;"
    : "page-break-inside:avoid;";
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>${escapeHtml(c.title)} — Material de aula</title>
<style>
  @page { size: ${opts.paper}; margin: ${MARGIN_CSS[opts.margin]}; }
  body{font-family:Georgia,serif;color:#111;line-height:1.55}
  h1{font-size:26px;margin-bottom:4px}
  h2{font-size:16px;text-transform:uppercase;letter-spacing:.08em;color:#444;margin-top:28px;border-bottom:1px solid #ccc;padding-bottom:4px}
  .meta{color:#666;font-size:13px;margin-bottom:18px}
  .box{background:#f6f6f6;border-left:4px solid #2563eb;padding:12px 16px;margin:12px 0}
  ul{padding-left:20px}
  li{margin:4px 0}
  .obj{border:1px solid #ddd;border-radius:6px;padding:14px 18px;margin:12px 0;${pageBreakObj}}
  .obj h3{margin:0 0 6px;font-size:14px;color:#2563eb;text-transform:uppercase;letter-spacing:.06em}
  .obj .q{font-weight:bold;font-size:15px}
  .obj .a{margin-top:8px;color:#222}
  .tag{display:inline-block;background:#eef2ff;color:#3730a3;font-size:11px;padding:2px 8px;border-radius:10px;margin-right:6px;text-transform:uppercase;letter-spacing:.05em}
  footer{margin-top:40px;color:#888;font-size:11px;text-align:center;border-top:1px solid #eee;padding-top:8px}
  .page-break{page-break-before:always}
</style></head><body>
<h1>${escapeHtml(c.title)}</h1>
<div class="meta">${escapeHtml(c.category)} · ${escapeHtml(c.difficulty)} · Conceito: ${escapeHtml(c.logicConcept)} · Papel ${opts.paper}</div>

<h2>Cenário</h2>
<p>${escapeHtml(c.scenario)}</p>

<h2>Por que estudar isso?</h2>
<div class="box">${escapeHtml(c.whyItMatters)}</div>
<p><strong>Habilidade transferível:</strong> ${escapeHtml(c.transferableSkill)}</p>

<h2>Onde isso aparece no mundo real</h2>
<ul>${c.realWorldApplications.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>

<h2>Respostas prontas para objeções dos alunos</h2>
${objections
  .map((o, i) => {
    const tag = TAG_LABEL[classifyObjection(o.question)];
    return `<div class="obj"><h3>Objeção ${i + 1}</h3><span class="tag">${escapeHtml(tag)}</span><div class="q">💬 ${escapeHtml(o.question)}</div><div class="a">${escapeHtml(o.answer)}</div></div>`;
  })
  .join("")}

<footer>FluxoLab · Material de apoio para aula · Imprima ou salve como PDF (Ctrl/Cmd+P)</footer>
<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300))</script>
</body></html>`;

  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const w = window.open(url, "_blank", "width=900,height=700");
  if (!w) {
    URL.revokeObjectURL(url);
    alert("Permita pop-ups para gerar o PDF.");
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadJSON(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CriticalThinkingLab() {
  const [progress, setProgress] = useState<Progress>(() => loadJSON(STORAGE_KEY, {}));
  const [objOverrides, setObjOverrides] = useState<ObjectionOverrides>(() =>
    loadJSON(OBJ_OVERRIDE_KEY, {}),
  );
  const [activeId, setActiveId] = useState<string>(CHALLENGES[0].id);
  const [filter, setFilter] = useState<"todos" | Difficulty>("todos");
  const [tagFilter, setTagFilter] = useState<"todos" | ObjectionTag>("todos");
  const [search, setSearch] = useState("");
  const [editingObj, setEditingObj] = useState(false);
  const [debateObjIdx, setDebateObjIdx] = useState<number | null>(null);
  const [printOpts, setPrintOpts] = useState<PrintOptions>({
    paper: "A4",
    margin: "normal",
    separateSections: true,
  });
  const [showPrintMenu, setShowPrintMenu] = useState(false);

  // Live debate (one step at a time)
  const [liveStep, setLiveStep] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!timerOn) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [timerOn]);

  useEffect(() => {
    setLiveStep(0);
    setSeconds(0);
    setTimerOn(false);
  }, [debateObjIdx, activeId]);

  const persistProg = (next: Progress) => {
    setProgress(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures in private browsing or restricted environments.
    }
  };
  const persistObj = (next: ObjectionOverrides) => {
    setObjOverrides(next);
    try {
      localStorage.setItem(OBJ_OVERRIDE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures in private browsing or restricted environments.
    }
  };

  const getProg = (id: string) =>
    progress[id] ?? { stepIdx: 0, notes: "", revealed: false, done: false };
  const updateProg = (id: string, patch: Partial<Progress[string]>) => {
    persistProg({ ...progress, [id]: { ...getProg(id), ...patch } });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CHALLENGES.filter((c) => {
      if (filter !== "todos" && c.difficulty !== filter) return false;
      const objs = getEffectiveObjections(c, objOverrides);
      if (tagFilter !== "todos") {
        const hasTag = objs.some((o) => classifyObjection(o.question) === tagFilter);
        if (!hasTag) return false;
      }
      if (q) {
        const tagLabels = objs.map((o) => TAG_LABEL[classifyObjection(o.question)].toLowerCase());
        const hit =
          c.title.toLowerCase().includes(q) ||
          c.scenario.toLowerCase().includes(q) ||
          objs.some(
            (o) => o.question.toLowerCase().includes(q) || o.answer.toLowerCase().includes(q),
          ) ||
          tagLabels.some((t) => t.includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [filter, tagFilter, search, objOverrides]);

  const active = CHALLENGES.find((c) => c.id === activeId) ?? CHALLENGES[0];
  const prog = getProg(active.id);
  const totalDone = Object.values(progress).filter((p) => p.done).length;
  const objections = getEffectiveObjections(active, objOverrides);
  const isCustom = !!objOverrides[active.id];

  // ---------- Editor handlers ----------
  const ensureDraft = (): StudentObjection[] =>
    objOverrides[active.id] ?? active.studentObjections.map((o) => ({ ...o }));
  const updateObjAt = (i: number, patch: Partial<StudentObjection>) => {
    const draft = ensureDraft().map((o, idx) => (idx === i ? { ...o, ...patch } : o));
    persistObj({ ...objOverrides, [active.id]: draft });
  };
  const addObj = () => {
    const draft = [
      ...ensureDraft(),
      { question: "Nova objeção do aluno...", answer: "Resposta do professor..." },
    ];
    persistObj({ ...objOverrides, [active.id]: draft });
  };
  const removeObjAt = (i: number) => {
    const draft = ensureDraft().filter((_, idx) => idx !== i);
    persistObj({ ...objOverrides, [active.id]: draft });
  };
  const resetObj = () => {
    const next = { ...objOverrides };
    delete next[active.id];
    persistObj(next);
  };

  // ---------- Export / Import overrides ----------
  const exportOverrides = () => {
    if (Object.keys(objOverrides).length === 0) {
      alert("Você ainda não tem objeções customizadas para exportar.");
      return;
    }
    downloadJSON("fluxolab-objecoes.json", {
      version: 1,
      exportedAt: new Date().toISOString(),
      overrides: objOverrides,
    });
  };
  const importOverrides = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming: ObjectionOverrides = parsed.overrides ?? parsed;
        // validação superficial
        for (const k of Object.keys(incoming)) {
          if (!Array.isArray(incoming[k])) throw new Error("Formato inválido em " + k);
          for (const o of incoming[k]) {
            if (typeof o.question !== "string" || typeof o.answer !== "string") {
              throw new Error("Objeções devem ter 'question' e 'answer' como strings.");
            }
          }
        }
        const merge = confirm(
          "Mesclar com suas objeções atuais? OK = mesclar (sobrescreve por desafio). Cancelar = SUBSTITUIR tudo.",
        );
        persistObj(merge ? { ...objOverrides, ...incoming } : incoming);
        alert("Importação concluída.");
      } catch (e) {
        alert("Falha ao importar: " + (e instanceof Error ? e.message : String(e)));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background md:flex-row">
      {/* Sidebar */}
      <aside className="h-72 w-full shrink-0 overflow-y-auto border-b border-border bg-card md:h-auto md:w-80 md:border-b-0 md:border-r">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Desafios de Pensamento Lógico
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalDone} de {CHALLENGES.length} concluídos · {filtered.length} no filtro
          </p>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, objeção ou tag…"
            className="mt-3 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="mt-3 flex gap-1">
            <button
              onClick={exportOverrides}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted"
              title="Baixar suas objeções customizadas em JSON"
            >
              ⬇ Exportar objeções
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted"
              title="Importar objeções de outra turma (JSON)"
            >
              ⬆ Importar
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importOverrides(e.target.files[0])}
            />
          </div>

          <div className="mt-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Dificuldade
            </p>
            <div className="flex flex-wrap gap-1">
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

          <div className="mt-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tipo de objeção crítica
            </p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setTagFilter("todos")}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                  tagFilter === "todos"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background hover:bg-muted"
                }`}
              >
                todas
              </button>
              {(Object.keys(TAG_LABEL) as ObjectionTag[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTagFilter(t)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                    tagFilter === t
                      ? "bg-primary text-primary-foreground"
                      : `${TAG_COLOR[t]} hover:opacity-80`
                  }`}
                  title={TAG_LABEL[t]}
                >
                  {TAG_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ul className="divide-y divide-border">
          {filtered.map((c) => {
            const p = getProg(c.id);
            return (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setActiveId(c.id);
                    setEditingObj(false);
                    setDebateObjIdx(null);
                  }}
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
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${diffColor[c.difficulty]}`}
                    >
                      {c.difficulty}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{c.category}</span>
                  </div>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="p-4 text-xs text-muted-foreground italic">
              Nenhum desafio com esses filtros.
            </li>
          )}
        </ul>
      </aside>

      {/* Main */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 md:p-8">
          <header className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${diffColor[active.difficulty]}`}
                >
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
            </div>
            <div className="relative shrink-0">
              <button
                onClick={() => setShowPrintMenu((v) => !v)}
                className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                title="Configurar e exportar PDF"
              >
                🖨️ Exportar PDF ▾
              </button>
              {showPrintMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 w-72 space-y-3 rounded-lg border border-border bg-card p-4 shadow-xl">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tamanho do papel
                    </p>
                    <div className="flex gap-1">
                      {(["A4", "Letter"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPrintOpts((o) => ({ ...o, paper: p }))}
                          className={`flex-1 rounded-md px-2 py-1 text-xs ${printOpts.paper === p ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Margens
                    </p>
                    <div className="flex gap-1">
                      {(["estreita", "normal", "larga"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setPrintOpts((o) => ({ ...o, margin: m }))}
                          className={`flex-1 rounded-md px-2 py-1 text-xs capitalize ${printOpts.margin === m ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={printOpts.separateSections}
                      onChange={(e) =>
                        setPrintOpts((o) => ({ ...o, separateSections: e.target.checked }))
                      }
                    />
                    Cada objeção em página/seção separada
                  </label>
                  <button
                    onClick={() => {
                      exportPrintable(active, objections, printOpts);
                      setShowPrintMenu(false);
                    }}
                    className="w-full rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    Gerar PDF agora
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Cenário */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Cenário
            </h3>
            <p className="text-sm leading-relaxed">{active.scenario}</p>
          </section>

          {/* Por que isso importa */}
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

          {/* Aplicações reais */}
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

          {/* Objeções: visualização + editor + debate socrático */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Objeções típicas dos alunos{" "}
                {isCustom && (
                  <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                    customizadas
                  </span>
                )}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingObj((v) => !v)}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  {editingObj ? "Concluir edição" : "✎ Editar"}
                </button>
                {isCustom && (
                  <button
                    onClick={resetObj}
                    className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                    title="Voltar para as objeções originais do desafio"
                  >
                    ↺ Restaurar padrão
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {objections.map((obj, i) => {
                const tag = classifyObjection(obj.question);
                const isDebating = debateObjIdx === i;
                return (
                  <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TAG_COLOR[tag]}`}
                      >
                        {TAG_LABEL[tag]}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setDebateObjIdx(isDebating ? null : i)}
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                            isDebating
                              ? "bg-primary text-primary-foreground"
                              : "border border-border hover:bg-muted"
                          }`}
                        >
                          {isDebating ? "Fechar debate" : "🎭 Conduzir debate"}
                        </button>
                        {editingObj && (
                          <button
                            onClick={() => removeObjAt(i)}
                            className="rounded-md border border-rose-300 px-2 py-0.5 text-[11px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>

                    {editingObj ? (
                      <div className="space-y-2">
                        <textarea
                          value={obj.question}
                          onChange={(e) => updateObjAt(i, { question: e.target.value })}
                          rows={2}
                          className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Pergunta crítica do aluno"
                        />
                        <textarea
                          value={obj.answer}
                          onChange={(e) => updateObjAt(i, { answer: e.target.value })}
                          rows={4}
                          className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Resposta / fundamentação"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold">
                          <span className="mr-1 text-primary">💬</span>
                          {obj.question}
                        </p>
                        <p className="mt-2 border-l-2 border-primary pl-3 text-sm leading-relaxed text-foreground/90">
                          {obj.answer}
                        </p>
                      </>
                    )}

                    {isDebating &&
                      (() => {
                        const playbook = SOCRATIC_PLAYBOOK[tag];
                        const cur = playbook[Math.min(liveStep, playbook.length - 1)];
                        const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
                        const ss = String(seconds % 60).padStart(2, "0");
                        return (
                          <div className="mt-3 rounded-md border border-primary/40 bg-primary/5 p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                Modo ao vivo · etapa {liveStep + 1} de {playbook.length} ·{" "}
                                {TAG_LABEL[tag]}
                              </p>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setTimerOn((v) => !v)}
                                  className={`rounded px-2 py-0.5 font-mono text-[11px] ${timerOn ? "bg-rose-500/20 text-rose-700 dark:text-rose-300" : "border border-border hover:bg-muted"}`}
                                  title="Iniciar/pausar cronômetro"
                                >
                                  {timerOn ? "⏸" : "⏱"} {mm}:{ss}
                                </button>
                                <button
                                  onClick={() => {
                                    setSeconds(0);
                                    setTimerOn(false);
                                  }}
                                  className="rounded border border-border px-1.5 py-0.5 text-[11px] hover:bg-muted"
                                  title="Resetar cronômetro"
                                >
                                  ↺
                                </button>
                              </div>
                            </div>

                            <div className="rounded-md bg-background/70 p-4">
                              <span
                                className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  cur.role === "professor"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : cur.role === "pergunta-socratica"
                                      ? "bg-violet-500/15 text-violet-700 dark:text-violet-400"
                                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                }`}
                              >
                                {cur.role === "professor"
                                  ? "professor"
                                  : cur.role === "pergunta-socratica"
                                    ? "pergunte"
                                    : "aluno (esperado)"}
                              </span>
                              <p className="mt-2 text-base leading-relaxed">{cur.text}</p>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-2">
                              <button
                                disabled={liveStep === 0}
                                onClick={() => setLiveStep((s) => Math.max(0, s - 1))}
                                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
                              >
                                ← Voltar
                              </button>
                              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="bg-primary transition-all"
                                  style={{ width: `${((liveStep + 1) / playbook.length) * 100}%` }}
                                />
                              </div>
                              <button
                                disabled={liveStep >= playbook.length - 1}
                                onClick={() =>
                                  setLiveStep((s) => Math.min(playbook.length - 1, s + 1))
                                }
                                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
                              >
                                Próxima →
                              </button>
                            </div>

                            <details className="mt-3">
                              <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground hover:underline">
                                Ver roteiro completo (todas as etapas)
                              </summary>
                              <ol className="mt-2 space-y-1.5">
                                {playbook.map((turn, ti) => (
                                  <li
                                    key={ti}
                                    className={`flex gap-2 text-xs ${ti === liveStep ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                                  >
                                    <span className="font-mono">{ti + 1}.</span>
                                    <span>{turn.text}</span>
                                  </li>
                                ))}
                              </ol>
                            </details>
                          </div>
                        );
                      })()}
                  </div>
                );
              })}

              {editingObj && (
                <button
                  onClick={addObj}
                  className="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  + Adicionar nova objeção da turma
                </button>
              )}
            </div>
          </section>

          {/* Provocações */}
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
                Roteiro: Passo {Math.min(prog.stepIdx + 1, active.steps.length)} de{" "}
                {active.steps.length}
              </h3>
              <div className="flex h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-primary transition-all"
                  style={{ width: `${(prog.stepIdx / active.steps.length) * 100}%` }}
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
                    className={`rounded-lg border p-3 transition ${isCurrent ? "border-primary bg-primary/5" : isDone ? "border-border bg-muted/30 opacity-70" : "border-border opacity-50"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
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

          {/* Anotações */}
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

          {/* Premissas e decisões */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Premissas dadas
              </h3>
              <ul className="space-y-1 text-sm">
                {active.premises.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Decisões esperadas
              </h3>
              <ul className="space-y-1 text-sm font-mono">
                {active.expectedDecisions.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">◇</span>
                    {d}
                  </li>
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
                <li key={i} className="flex gap-2">
                  <span>⚠️</span>
                  {p}
                </li>
              ))}
            </ul>
          </section>

          {/* Solução */}
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
                    <span className="mr-2 text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}.
                    </span>
                    {line}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Tente esboçar o fluxo no editor antes de revelar a referência. O processo de errar e
                ajustar é parte do aprendizado.
              </p>
            )}
          </section>

          {/* Concluir */}
          <section className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
            <div>
              <p className="text-sm font-semibold">Pronto para o próximo desafio?</p>
              <p className="text-xs text-muted-foreground">
                Marque como concluído quando tiver desenhado o fluxo no editor e comparado com a
                referência.
              </p>
            </div>
            <button
              onClick={() => updateProg(active.id, { done: !prog.done })}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${prog.done ? "bg-emerald-500 text-white hover:opacity-90" : "bg-primary text-primary-foreground hover:opacity-90"}`}
            >
              {prog.done ? "✓ Concluído" : "Marcar como concluído"}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
