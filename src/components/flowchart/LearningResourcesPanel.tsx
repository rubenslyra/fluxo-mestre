import { BookOpen, ExternalLink, FileCode2, Layers, ShieldCheck } from "lucide-react";

type PracticeItem = {
  title: string;
  detail: string;
};

type ResourceItem = {
  title: string;
  href: string;
  note: string;
  label: string;
};

const PRACTICES: PracticeItem[] = [
  {
    title: "Separe rótulo visual e nome técnico",
    detail:
      "Use o rótulo para explicar a regra no fluxograma e o nome técnico para orientar métodos, classes, módulos e constantes geradas.",
  },
  {
    title: "Agrupe por responsabilidade real",
    detail:
      "Agrupadores devem representar camadas, casos de uso, módulos, bounded contexts ou etapas de negócio, não apenas organização visual.",
  },
  {
    title: "Rotule cada decisão",
    detail:
      "Saídas Sim/Não, sucesso/falha e caminhos de retorno precisam estar explícitos para virar testes, PlantUML e código revisável.",
  },
  {
    title: "Transforme fluxo em contrato de teste",
    detail:
      "Cada caminho relevante do desenho deve gerar pelo menos um caso de teste: caminho feliz, erro, borda e repetição.",
  },
  {
    title: "Use blueprint conforme complexidade",
    detail:
      "Fluxos lineares combinam com procedural limpo; decisões substituíveis combinam com Strategy; sequências longas combinam com pipeline.",
  },
  {
    title: "Preserve a licença comunitária",
    detail:
      "Ao redistribuir ou adaptar o FluxoLab, mantenha atribuição, licença CC BY-NC-SA 4.0 e restrição de uso comercial.",
  },
];

const OFFICIAL_DOCS: ResourceItem[] = [
  {
    title: "Python 3 Documentation",
    href: "https://docs.python.org/3/",
    note: "Referência da linguagem, biblioteca padrão, tutoriais e HOWTOs.",
    label: "Python",
  },
  {
    title: "PEP 8 - Style Guide for Python Code",
    href: "https://peps.python.org/pep-0008/",
    note: "Convenções de legibilidade, nomes, imports, comentários e layout.",
    label: "Python",
  },
  {
    title: "C# Language Documentation",
    href: "https://learn.microsoft.com/en-us/dotnet/csharp/",
    note: "Sintaxe, semântica, guias e especificações de recursos do C#.",
    label: "C#",
  },
  {
    title: ".NET Architecture Guides",
    href: "https://dotnet.microsoft.com/en-us/learn/dotnet/architecture-guides",
    note: "Guias oficiais para aplicações web, cloud-native, microsserviços e arquitetura.",
    label: ".NET",
  },
  {
    title: "Java Documentation",
    href: "https://docs.oracle.com/en/java/",
    note: "Documentação Java SE, APIs, ferramentas, guias e notas de release.",
    label: "Java",
  },
  {
    title: "Java Language Specification",
    href: "https://docs.oracle.com/javase/specs/",
    note: "Especificação da linguagem Java para dúvidas de semântica e sintaxe.",
    label: "Java",
  },
  {
    title: "MDN JavaScript Guide",
    href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    note: "Guia prático da linguagem JavaScript e dos objetos principais.",
    label: "JavaScript",
  },
  {
    title: "ECMAScript Specification",
    href: "https://tc39.es/ecma262/",
    note: "Especificação oficial mantida pelo TC39 para a linguagem ECMAScript.",
    label: "JavaScript",
  },
  {
    title: "ISO C++ Standard",
    href: "https://isocpp.org/std/the-standard",
    note: "Ponto oficial sobre o padrão C++ atual e materiais relacionados.",
    label: "C/C++",
  },
  {
    title: "C++ Core Guidelines",
    href: "https://isocpp.org/guidelines",
    note: "Diretrizes modernas de C++ para recursos, ownership, expressões e interfaces.",
    label: "C/C++",
  },
];

const BOOKS: ResourceItem[] = [
  {
    title: "Refactoring, 2nd Edition - Martin Fowler",
    href: "https://martinfowler.com/books/refactoring.html",
    note: "Base para melhorar código gerado sem alterar comportamento observável.",
    label: "Arquitetura",
  },
  {
    title: "Domain-Driven Design - Eric Evans",
    href: "https://www.oreilly.com/library/view/domain-driven-design-tackling/0321125215/",
    note: "Referência para transformar agrupadores em linguagem ubíqua e contextos.",
    label: "DDD",
  },
  {
    title: "Design Patterns - Gamma, Helm, Johnson e Vlissides",
    href: "https://www.oreilly.com/library/view/design-patterns-elements/0201633612/",
    note: "Catálogo clássico para discutir Strategy, Template Method e Command.",
    label: "Padrões",
  },
  {
    title: "Effective Python - Brett Slatkin",
    href: "https://www.oreilly.com/library/view/effective-python-90/9780134854717/",
    note: "Boas práticas para transformar fluxos em Python legível e idiomático.",
    label: "Python",
  },
  {
    title: "C# in Depth - Jon Skeet",
    href: "https://www.manning.com/books/c-sharp-in-depth-fourth-edition",
    note: "Aprofundamento em C# para classes, generics, async e decisões de linguagem.",
    label: "C#",
  },
  {
    title: "Effective Java, 3rd Edition - Joshua Bloch",
    href: "https://www.oreilly.com/library/view/effective-java-3rd/9781492069669/",
    note: "Itens práticos para criar APIs, classes e objetos Java com menos acoplamento.",
    label: "Java",
  },
  {
    title: "JavaScript: The Definitive Guide - David Flanagan",
    href: "https://www.oreilly.com/library/view/javascript-the-definitive/9781491952016/",
    note: "Referência abrangente para JavaScript moderno e APIs essenciais.",
    label: "JavaScript",
  },
  {
    title: "Effective Modern C++ - Scott Meyers",
    href: "https://www.oreilly.com/library/view/effective-modern-c/9781491908419/",
    note: "Diretrizes para C++ moderno, ownership, tipos e expressões mais seguras.",
    label: "C/C++",
  },
];

function ResourceList({ items }: { items: ResourceItem[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="group rounded-lg border border-border bg-card p-4 transition hover:border-primary/60 hover:bg-muted/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="mb-2 inline-flex rounded border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {item.label}
              </span>
              <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
            </div>
            <ExternalLink
              aria-hidden
              className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:text-primary"
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.note}</p>
        </a>
      ))}
    </div>
  );
}

export function LearningResourcesPanel() {
  return (
    <main className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 md:p-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Release comunitária
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Boas Práticas e Referências</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Curadoria para transformar fluxogramas ISO 5807 em código evolutivo, revisar decisões
              arquiteturais e manter a continuidade técnica do FluxoLab.
            </p>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1">
              <Layers aria-hidden className="size-3.5" />
              Arquitetura
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1">
              <ShieldCheck aria-hidden className="size-3.5" />
              CC BY-NC-SA 4.0
            </span>
          </div>
        </header>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <FileCode2 aria-hidden className="size-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Boas práticas para evoluir fluxos em código
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {PRACTICES.map((item) => (
              <article key={item.title} className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <FileCode2 aria-hidden className="size-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Documentações oficiais
            </h2>
          </div>
          <ResourceList items={OFFICIAL_DOCS} />
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen aria-hidden className="size-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Livros técnicos recomendados
            </h2>
          </div>
          <ResourceList items={BOOKS} />
        </section>
      </div>
    </main>
  );
}
