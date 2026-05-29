import { ArrowLeft, FileText, ShieldCheck, Cookie, Scale } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type LegalSection = {
  title: string;
  icon: "privacy" | "use" | "cookies" | "summary";
  paragraphs: string[];
  bullets?: string[];
};

interface LegalDocumentPageProps {
  title: string;
  subtitle: string;
  sections: LegalSection[];
}

const ICONS = {
  privacy: ShieldCheck,
  use: Scale,
  cookies: Cookie,
  summary: FileText,
} satisfies Record<LegalSection["icon"], typeof FileText>;

export function LegalDocumentPage({ title, subtitle, sections }: LegalDocumentPageProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-card">
              <FileText aria-hidden className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Voltar ao editor
          </Link>
        </header>

        <main className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = ICONS[section.icon];
            return (
              <section key={section.title} className="rounded-lg border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                    <Icon aria-hidden className="size-5" />
                  </div>
                  <h2 className="text-base font-semibold">{section.title}</h2>
                </div>
                <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="space-y-2 pl-5">
                      {section.bullets.map((item) => (
                        <li key={item} className="list-disc">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}
