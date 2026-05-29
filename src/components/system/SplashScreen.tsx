import { Cookie, FileText, LoaderCircle, ShieldCheck, Scale } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface SplashScreenProps {
  open: boolean;
  ready: boolean;
  onEnter: () => void;
}

const policyLinks = [
  {
    to: "/privacidade",
    label: "Privacidade",
    description: "Como os dados locais, preferências e exportações são tratados.",
    icon: ShieldCheck,
  },
  {
    to: "/uso",
    label: "Uso",
    description: "Regras práticas para operar o editor e o gerador.",
    icon: Scale,
  },
  {
    to: "/cookies",
    label: "Cookies",
    description: "O que fica salvo no navegador e por quê.",
    icon: Cookie,
  },
] as const;

export function SplashScreen({ open, ready, onEnter }: SplashScreenProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/96 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
          <section className="flex flex-col justify-between border-b border-border p-6 md:border-b-0 md:border-r">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-md border border-border bg-background">
                  <FileText aria-hidden className="size-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    FluxoLab
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Editor de fluxogramas e artefatos técnicos
                  </h1>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle aria-hidden className="size-4 animate-spin text-primary" />
                  <span>
                    {ready
                      ? "Ambiente pronto para uso"
                      : "Carregando editor, políticas e preferências locais"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div
                    className={`h-full rounded-full bg-primary transition-all duration-700 ${
                      ready ? "w-full" : "w-2/3 animate-pulse"
                    }`}
                  />
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Esta tela inicial apresenta o app, concentra os avisos legais e prepara o editor
                  local. As políticas abaixo explicam privacidade, uso e cookies. A documentação
                  completa fica em `Manual-da-Aplicacao/` no repositório.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onEnter}
                disabled={!ready}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Entrar no editor
              </button>
              <Link
                to="/privacidade"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Ler políticas
              </Link>
            </div>
          </section>

          <aside className="p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Políticas e termos
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesso rápido aos documentos que acompanham a aplicação.
              </p>
            </div>
            <div className="space-y-3">
              {policyLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-start gap-3 rounded-md border border-border bg-background p-3 transition hover:bg-muted"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon aria-hidden className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-5 rounded-md border border-dashed border-border bg-background p-4 text-xs leading-5 text-muted-foreground">
              O app grava preferências locais no navegador para tema, exportação e ajustes de
              interface. Não há exigência de conta para uso básico.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
