import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço acessado não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FluxoLab - Criador de Fluxogramas ISO 5807" },
      {
        name: "description",
        content:
          "Aplicação web para criação de fluxogramas com base na norma ISO 5807 e módulo de desafios de lógica para apoio didático em aulas de algoritmos.",
      },
      { name: "author", content: "Rubens Lyra" },
      { name: "creator", content: "Rubens Lyra - @rubinholyralabs" },
      { name: "publisher", content: "Rubens Lyra Labs" },
      { property: "og:title", content: "FluxoLab - Criador de Fluxogramas ISO 5807" },
      {
        property: "og:description",
        content:
          "Aplicação web para criação de fluxogramas com base na norma ISO 5807 e módulo de desafios de lógica para apoio didático em aulas de algoritmos.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@rubinholyralabs" },
      { name: "twitter:creator", content: "@rubinholyralabs" },
      { name: "twitter:title", content: "FluxoLab - Criador de Fluxogramas ISO 5807" },
      {
        name: "twitter:description",
        content:
          "Aplicação web para criação de fluxogramas com base na norma ISO 5807 e módulo de desafios de lógica para apoio didático em aulas de algoritmos.",
      },
      {
        property: "og:image",
        content: "/fluxolab/logo.png",
      },
      {
        name: "twitter:image",
        content: "/fluxolab/logo.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
