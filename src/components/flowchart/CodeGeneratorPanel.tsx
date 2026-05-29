import { Check, Code2, Copy, Database, Download, Workflow, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { FlowDoc } from "./types";
import {
  ARTIFACT_TARGETS,
  CODE_BLUEPRINTS,
  CODE_LANGUAGES,
  CODE_REFERENCE_LINKS,
  generateArtifact,
  getArtifactFileName,
  type ArtifactKind,
  type CodeBlueprintId,
  type CodeLanguage,
  type GenerationMetadata,
} from "./codeBlueprints";

interface CodeGeneratorPanelProps {
  doc: FlowDoc;
  open: boolean;
  onClose: () => void;
}

const ARTIFACT_ICONS = {
  code: Code2,
  uml: Workflow,
  database: Database,
} satisfies Record<ArtifactKind, typeof Code2>;

export function CodeGeneratorPanel({ doc, open, onClose }: CodeGeneratorPanelProps) {
  const [artifact, setArtifact] = useState<ArtifactKind>("code");
  const [language, setLanguage] = useState<CodeLanguage>("python");
  const [blueprint, setBlueprint] = useState<CodeBlueprintId>("procedural");
  const [title, setTitle] = useState("");
  const [briefDescription, setBriefDescription] = useState("");
  const [comments, setComments] = useState("");
  const [copied, setCopied] = useState(false);

  const metadata = useMemo<GenerationMetadata>(
    () => ({
      title: title.trim(),
      briefDescription: briefDescription.trim(),
      comments: comments.trim(),
    }),
    [briefDescription, comments, title],
  );
  const requiredMetadataReady = metadata.title.length > 0 && metadata.briefDescription.length > 0;
  const generatedArtifact = useMemo(
    () =>
      requiredMetadataReady
        ? generateArtifact(doc, { artifact, language, blueprint, metadata })
        : "",
    [artifact, blueprint, doc, language, metadata, requiredMetadataReady],
  );
  const outputFileName = useMemo(
    () =>
      requiredMetadataReady
        ? getArtifactFileName(artifact, { language, metadata })
        : "preencha-titulo-e-descricao.txt",
    [artifact, language, metadata, requiredMetadataReady],
  );
  const selectedLanguage = CODE_LANGUAGES.find((item) => item.id === language) ?? CODE_LANGUAGES[0];
  const selectedArtifact =
    ARTIFACT_TARGETS.find((item) => item.id === artifact) ?? ARTIFACT_TARGETS[0];

  if (!open) return null;

  const copyCode = async () => {
    if (!requiredMetadataReady) return;
    await navigator.clipboard.writeText(generatedArtifact);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const downloadCode = () => {
    if (!requiredMetadataReady) return;
    const blob = new Blob([generatedArtifact], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = outputFileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-base font-bold">Gerar Artefatos</h2>
            <p className="text-xs text-muted-foreground">
              {doc.nodes.length} símbolos · {doc.edges.length} conexões
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X aria-hidden className="size-4" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto border-r border-border p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Metadados
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Título obrigatório</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex: Sistema de notas do módulo"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Usado para namespace, pacote, classe, schema e nome de arquivo.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Breve descrição obrigatória
                </label>
                <textarea
                  value={briefDescription}
                  onChange={(event) => setBriefDescription(event.target.value)}
                  rows={3}
                  placeholder="Resumo objetivo do algoritmo, regra de negócio ou domínio."
                  required
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Comentários opcionais</label>
                <textarea
                  value={comments}
                  onChange={(event) => setComments(event.target.value)}
                  rows={3}
                  placeholder="Observações para revisão, integração ou implementação."
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Saída
            </p>
            <div className="mb-5 space-y-2">
              {ARTIFACT_TARGETS.map((item) => {
                const Icon = ARTIFACT_ICONS[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setArtifact(item.id)}
                    className={`flex w-full items-start gap-2 rounded-md border p-2 text-left ${
                      artifact === item.id
                        ? "border-primary bg-primary/15"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <span>
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {item.summary}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Linguagem
            </p>
            <div
              className={`mb-5 grid grid-cols-2 gap-2 ${artifact !== "code" ? "opacity-50" : ""}`}
            >
              {CODE_LANGUAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLanguage(item.id)}
                  disabled={artifact !== "code"}
                  className={`rounded-md border px-2 py-1.5 text-sm ${
                    language === item.id
                      ? "border-primary bg-primary/15 font-semibold text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Blueprint
            </p>
            <div className={`space-y-2 ${artifact !== "code" ? "opacity-50" : ""}`}>
              {CODE_BLUEPRINTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBlueprint(item.id)}
                  disabled={artifact !== "code"}
                  className={`w-full rounded-md border p-2 text-left ${
                    blueprint === item.id
                      ? "border-primary bg-primary/15"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{item.summary}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-md border border-border bg-muted/40 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Base técnica
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {CODE_REFERENCE_LINKS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
              <div className="min-w-0">
                <span className="block truncate text-xs font-semibold text-muted-foreground">
                  {requiredMetadataReady ? outputFileName : selectedArtifact.label}
                </span>
                {!requiredMetadataReady && (
                  <span className="block text-[11px] text-destructive">
                    Preencha título e breve descrição para gerar.
                  </span>
                )}
                {artifact === "code" && requiredMetadataReady && (
                  <span className="block text-[11px] text-muted-foreground">
                    {selectedLanguage.label} ·{" "}
                    {CODE_BLUEPRINTS.find((item) => item.id === blueprint)?.label}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCode}
                  disabled={!requiredMetadataReady}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  {copied ? (
                    <Check aria-hidden className="size-3.5" />
                  ) : (
                    <Copy aria-hidden className="size-3.5" />
                  )}
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <button
                  type="button"
                  onClick={downloadCode}
                  disabled={!requiredMetadataReady}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
                >
                  <Download aria-hidden className="size-3.5" />
                  Baixar
                </button>
              </div>
            </div>
            <pre className="min-h-0 flex-1 overflow-auto bg-background p-4 font-mono text-xs leading-relaxed text-foreground">
              <code>
                {requiredMetadataReady
                  ? generatedArtifact
                  : "// Informe os metadados obrigatórios para gerar o artefato."}
              </code>
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
