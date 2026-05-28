# Nota de versao - Unreleased

Este arquivo acumula mudancas concluidas antes do fechamento de uma versao. Itens planejados devem ficar em `tasks/backlog.md`; aqui entram apenas mudancas realizadas ou preparadas para release.

## Adicionado

- Estrutura interna de analises em `docs/repo-interno/`, com areas para analises, observacoes, tasks, releases e templates.
- Primeiro diagnostico historico registrado: `ANA-2026-05-25-001`.
- Backlog inicial de tasks derivadas da analise de 2026-05-25.
- Caso especializado no gerador local para sistema de registro de notas de modulo, com menu do tester: teste manual com 5 alunos, seed com 100 alunos, ajuda e sair.
- Exemplo pronto no painel do gerador para preencher o enunciado de registro de notas.
- Exportacao em PDF do fluxograma, usando paginas A4 em paisagem, margem fixa, centralizacao e paginacao automatica.
- Timbre RLLabs no PDF, com selo visual, titulo `FluxoLab`, subtitulo `Rubinho Lyra Labs`, ID de arquivo gerado, versao do sistema e numeracao de paginas.
- Container Docker local com Bun SSR atras de nginx, publicado pela porta `8088`.
- Build publico `build:fluxolab` para gerar assets com base path `/fluxolab/`.

## Alterado

- O relatorio `RELATORIO_DIAGNOSTICO_ATIVIDADES.md` foi movido para `docs/repo-interno/analises/2026-05-25-diagnostico-atividades.md`.
- Enunciado exemplo de avaliacao de alunos foi reestruturado como especificacao de sistema, separando objetivo, menu, entradas, validacoes, formula e saidas.
- Parser de entradas com faixa agora remove prefixos de lista antes de extrair nomes como `avaliacao_1`.
- Menu de exportacao agora permite escolher entre PNG, SVG e PDF.
- Paginacao do PDF agora reserva area tecnica de cabecalho/rodape e calcula quebras sem dividir simbolos do fluxograma.
- Exportacao PDF agora tenta usar o bitmap `public/logo.png` reduzido para um JPEG pequeno no cabecalho, mantendo fallback vetorial caso o ativo nao carregue.
- Router TanStack usa `import.meta.env.BASE_URL` como `basepath`, permitindo servir a aplicacao em `/fluxolab`.
- nginx redireciona `/` para `/fluxolab/`, responde healthcheck tambem em `/fluxolab/healthz` e serve assets estaticos sob o prefixo publico.

## Corrigido

- Crash do editor ao mover o canvas quando a referencia de pan era limpa antes do updater de estado ler `vx`/`vy`.
- Erro `Tainted canvases may not be exported` ao imprimir/exportar PDF.
- Risco de canvas tainted no PNG ao remover `foreignObject` do SVG standalone usado na exportacao.
- Corte de figuras no meio da pagina impressa; conexoes podem continuar entre paginas, mas simbolos inteiros sao mantidos em uma unica pagina.

## Evidencias

- Origem: `OBS-2026-05-25-001`
- Origem: `OBS-2026-05-25-002`
- Origem: `OBS-2026-05-25-003`
- Origem: `OBS-2026-05-25-004`
- Origem: `OBS-2026-05-25-005`
- Origem: `OBS-2026-05-25-006`
- Origem: `OBS-2026-05-25-007`
- Origem: `OBS-2026-05-25-008`
- Origem: `OBS-2026-05-25-009`
- Analise base: `ANA-2026-05-25-001`
- Task concluida: `TASK-2026-05-25-008`
- Task concluida: `TASK-2026-05-25-009`
- Task concluida: `TASK-2026-05-25-010`
- Task concluida: `TASK-2026-05-25-011`
- Task concluida: `TASK-2026-05-25-012`
- Task concluida: `TASK-2026-05-25-013`
- Task concluida: `TASK-2026-05-25-014`
- Task concluida: `TASK-2026-05-25-015`
- Verificacao: `bunx tsc --noEmit --pretty false`
- Verificacao: `bun run build`
- Verificacao: `bun run build:fluxolab`
- Verificacao focal: `bunx eslint src/router.tsx src/components/flowchart/exportImage.ts` sem erros; permanece aviso Fast Refresh em `src/router.tsx`.
- Verificacao focal: `bunx eslint src/components/flowchart/exportImage.ts`
- Validacao gerada: 36 simbolos, 44 conexoes, 0 issues ISO internas.
- Validacao do enunciado reestruturado: 36 simbolos, 44 conexoes, 0 issues ISO internas.
- Validacao no browser: SVG `image/svg+xml` com assinatura `3C73766720786D6C`; PNG `image/png` com assinatura `89504E470D0A1A0A`; PDF `application/pdf` com assinatura `255044462D312E34`.
- Validacao pos-correcao: SVG, PNG e PDF exportaram no Edge sem `SecurityError`; o fluxograma do PDF e gerado como vetor, sem depender de canvas exportado.
- Validacao de PDF paginado: fluxo vertical alto gerou PDF `application/pdf`, assinatura `%PDF-`, 4 paginas, timbre presente, ID `FL-*`, versao presente e todas as labels preservadas.
- Validacao Docker: `docker build -t fluxolab:local .` e `docker compose config` concluiram; container `fluxolab` respondeu `200` em `/healthz`, `/` e `/logo.png`; HTML contem `FluxoLab` e assets.
- Validacao subrota publica: container `fluxolab` healthy; `/` retorna `302` para `/fluxolab/`; `/fluxolab` retorna `301`; `/fluxolab/`, `/fluxolab/healthz`, `/fluxolab/logo.png` e assets CSS/JS referenciados pelo HTML retornam `200`.

## Pendencias antes de fechar versao

- Promover apenas tasks concluidas para secoes de release.
- Validar comandos de qualidade relevantes para a versao.
- Registrar data, escopo e hash de commit quando a versao for fechada.
