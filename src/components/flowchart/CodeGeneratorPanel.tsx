import { Check, Copy, Download, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { FlowDoc } from "./types";
import {
  CODE_BLUEPRINTS,
  CODE_LANGUAGES,
  CODE_REFERENCE_LINKS,
  generateCode,
  type CodeBlueprintId,
  type CodeLanguage,
} from "./codeBlueprints";

interface CodeGeneratorPanelProps {
  doc: FlowDoc;
  open: boolean;
  onClose: () => void;
}

export function CodeGeneratorPanel({ doc, open, onClose }: CodeGeneratorPanelProps) {
  const [language, setLanguage] = useState<CodeLanguage>("python");
  const [blueprint, setBlueprint] = useState<CodeBlueprintId>("procedural");
  const [copied, setCopied] = useState(false);

  const generatedCode = useMemo(
    () => generateCode(doc, { language, blueprint }),
    [blueprint, doc, language],
  );
  const selectedLanguage = CODE_LANGUAGES.find((item) => item.id === language) ?? CODE_LANGUAGES[0];

  if (!open) return null;

  const copyCode = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = selectedLanguage.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-base font-bold">Gerar Código</h2>
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

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto border-r border-border p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Linguagem
            </p>
            <div className="mb-5 grid grid-cols-2 gap-2">
              {CODE_LANGUAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLanguage(item.id)}
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
            <div className="space-y-2">
              {CODE_BLUEPRINTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBlueprint(item.id)}
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
              <span className="text-xs font-semibold text-muted-foreground">
                {selectedLanguage.fileName}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCode}
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
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <Download aria-hidden className="size-3.5" />
                  Baixar
                </button>
              </div>
            </div>
            <pre className="min-h-0 flex-1 overflow-auto bg-background p-4 font-mono text-xs leading-relaxed text-foreground">
              <code>{generatedCode}</code>
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
