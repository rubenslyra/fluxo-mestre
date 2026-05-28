# Relatorio de diagnostico das ultimas atividades

Data da analise: 2026-05-25  
Repositorio: `D:\source\iso-flow-art`  
Branch: `main`  
Estado remoto: `main` esta 1 commit a frente de `origin/main`

## Resumo executivo

As ultimas atividades apontam para uma mudanca clara de direcao: a geracao de fluxogramas deixou de depender do AI Gateway/Lovable no servidor e passou a usar um gerador local heuristico no cliente. A aplicacao compila, o typecheck passa e o build de producao conclui com sucesso. O principal problema objetivo encontrado e o lint falhando por configuracao/normalizacao de finais de linha CRLF vs LF.

O diagnostico realista e que a base esta funcional em termos de compilacao, mas a mudanca reduz bastante a capacidade real de "IA". O recurso agora gera fluxos por regras fixas e deteccao de palavras-chave. Isso pode ser aceitavel para demonstracao, ambiente offline ou sala de aula, mas nao entrega a mesma qualidade de modelagem que o fluxo anterior com LLM estruturado.

## Atividade recente em Git

Ultimos commits relevantes:

- `7cb7bfc` em 2026-05-23: `feat: normalize flowchart document on load and improve AI gateway configuration`
- `c4b8b9d` em 2026-05-14: merge do Dependabot para dependencias TanStack
- `ae42c3d` em 2026-05-14: bump de `@tanstack/start-server-core` e `@tanstack/react-start`
- `c021bb4` em 2026-05-14: adicao de undo/redo e preferencias no canvas

Estado local atual:

- 10 arquivos modificados/removidos rastreados.
- 1 arquivo novo nao rastreado: `src/components/flowchart/flowGenerator.ts`.
- `bun.lockb`, `package-lock.json` e `package.json` foram alterados.
- A branch local esta 1 commit a frente do remoto.

## Mudancas locais identificadas

### Geracao de fluxograma

Arquivos afetados:

- `src/components/flowchart/AiGeneratorPanel.tsx`
- `src/components/flowchart/aiLayout.ts`
- `src/components/flowchart/flowGenerator.ts`
- `src/lib/ai-gateway.ts` removido
- `src/lib/flowchart-ai.functions.ts` removido

O painel deixou de usar `useServerFn(generateFlowchart)` e passou a chamar `generateLocalFlowchart(description.trim())`. Isso remove a dependencia de chave de API, servidor e gateway externo.

Impacto positivo:

- Funciona sem conta externa e sem chave.
- Nao envia dados do usuario para provedor externo.
- Reduz risco operacional de falha por limite, credito ou indisponibilidade do gateway.
- Simplifica o fluxo tecnico de geracao.

Impacto negativo:

- A geracao nao e mais IA generativa de fato; e uma heuristica local.
- A cobertura semantica e baixa para enunciados variados.
- O resultado pode parecer correto visualmente, mas representar mal regras de negocio.
- A interface ainda usa o titulo "Agente IA", o que pode criar expectativa incorreta.

### Dependencias e configuracao

Arquivos afetados:

- `package.json`
- `package-lock.json`
- `bun.lockb`
- `vite.config.ts`

Foram removidas dependencias de IA e a configuracao `@lovable.dev/vite-tanstack-config`. O `vite.config.ts` agora declara explicitamente os plugins:

- `tanstackStart()`
- `viteReact()`
- `tailwindcss()`
- `tsConfigPaths()`

O build passou com essa configuracao, entao nao ha evidencia atual de quebra de empacotamento. Ainda assim, a configuracao anterior mencionava recursos agregados do pacote Lovable, como integracao com Cloudflare em build-only, aliases, dedupe e injecao de ambiente. Como a nova configuracao e mais enxuta, vale confirmar se todos esses recursos eram dispensaveis no fluxo de deploy real.

### Metadados e rota gerada

Arquivos afetados:

- `src/routes/__root.tsx`
- `src/routeTree.gen.ts`

Os metadados foram trocados de `Lovable` para `FluxoLab`, o que e coerente com a remocao da dependencia da plataforma. O arquivo `routeTree.gen.ts` recebeu declaracao adicional de tipos para TanStack Start. Como esse arquivo geralmente e gerado, ha risco de alteracao manual ser sobrescrita por tooling.

## Verificacoes executadas

### TypeScript

Comando:

```powershell
bunx tsc --noEmit --pretty false
```

Resultado: passou sem erros.

### Build de producao

Comando:

```powershell
bun run build
```

Resultado: passou. O build gerou cliente e SSR com Vite 7.3.1. Houve apenas avisos de imports nao usados dentro de pacotes TanStack em `node_modules`, sem falha de build.

### Lint

Comando:

```powershell
bun run lint
```

Resultado: falhou.

Diagnostico: a falha dominante e `prettier/prettier` pedindo `Delete CR`, indicando conflito de finais de linha CRLF com a expectativa de LF. Isso aparece em muitos arquivos, incluindo `eslint.config.js`, `AiGeneratorPanel.tsx` e `aiHistory.ts`. Nao apareceu como erro funcional do codigo alterado; e um problema de normalizacao/formato.

## Riscos principais

1. Perda de qualidade funcional na geracao

O fluxo anterior usava schema com Zod e LLM para produzir uma estrutura validada. O fluxo atual depende de palavras-chave e de um caso especial para notas de alunos. O risco e alto para usuarios esperando modelagem correta de algoritmos mais complexos.

2. Comunicacao de produto desalinhada

O painel ainda se apresenta como "Agente IA". Como a geracao agora e local e heuristica, a nomenclatura pode induzir usuario a confiar demais no resultado.

3. Lockfiles com churn grande

`package-lock.json` teve uma reducao grande e `bun.lockb` tambem mudou. Isso parece coerente com a remocao de dependencias, mas deve ser revisado com cuidado para evitar divergencia entre Bun e npm.

4. Configuracao Vite menos completa

A troca removeu um pacote de configuracao opinativo. O build local passa, mas ainda precisa ser confirmado no ambiente alvo, especialmente se houver deploy em Cloudflare ou dependencia dos plugins que eram fornecidos pelo pacote anterior.

5. Lint bloqueado por finais de linha

Enquanto o problema de EOL continuar, `bun run lint` nao serve como gate confiavel de qualidade. Isso tambem pode gerar diffs ruidosos em Windows.

6. Arquivo gerado editado

`src/routeTree.gen.ts` parece arquivo gerado. Alteracoes manuais nele podem ser descartadas quando o gerador rodar novamente.

## Diagnostico realista

A aplicacao nao esta quebrada: typecheck e build passaram. O estado atual e tecnicamente executavel.

O ponto critico nao e compilacao, e sim produto/qualidade: a remocao da IA externa foi bem-sucedida do ponto de vista operacional, mas rebaixou a inteligencia do gerador. O novo caminho e mais robusto para ambiente offline e mais simples para manutencao, porem entrega resultados muito mais genericos.

Se o objetivo e ter um assistente didatico basico, a direcao e aceitavel, desde que a interface deixe claro que a geracao e local e precisa de revisao. Se o objetivo e manter um "agente IA" capaz de interpretar enunciados variados com boa fidelidade, a mudanca atual e insuficiente.

## Recomendacoes objetivas

1. Decidir o posicionamento do recurso

Escolher entre:

- "Gerador local assistido" para manter simplicidade e privacidade.
- "Agente IA" real, reintroduzindo um provedor LLM com fallback local.

2. Corrigir EOL/Prettier

Adicionar ou ajustar configuracao de finais de linha, por exemplo com `endOfLine`, e normalizar os arquivos. Sem isso, o lint continuara falhando por formato.

3. Validar lockfiles

Como ha `bun.lockb` e `package-lock.json`, definir qual gerenciador e fonte de verdade. Manter dois lockfiles pode ser aceitavel, mas aumenta chance de inconsistencia.

4. Evitar edicao manual duradoura em `routeTree.gen.ts`

Confirmar se a declaracao de tipos deve ficar em um arquivo controlado pelo desenvolvedor ou se o gerador TanStack deve recria-la automaticamente.

5. Criar testes para `flowGenerator.ts`

Cobrir pelo menos:

- enunciado simples sem loop/decisao;
- enunciado com entrada e saida;
- enunciado com loop;
- enunciado com decisao;
- codigo de exemplo com `random.uniform` e lista de alunos.

6. Ajustar texto da interface

Se a geracao permanecer local, trocar "Agente IA" por uma nomenclatura mais precisa, como "Gerador local de fluxograma" ou "Assistente de fluxograma".

## Conclusao

O estado atual e bom para consolidar uma versao offline/simples do recurso. Nao e bom ainda para vender a funcionalidade como IA confiavel. O proximo passo mais pragmatico e corrigir o lint por EOL, alinhar a linguagem da interface com o comportamento real e adicionar testes pequenos para o novo gerador local.
