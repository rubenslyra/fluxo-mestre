# Repo interno de analises

Este diretorio guarda observacoes, diagnosticos, decisoes e tarefas derivadas das analises do projeto. Ele nao e um repositorio Git separado; e uma area versionada dentro do proprio codigo para manter historico tecnico e alimentar notas de versao.

## Objetivo

- Registrar analises com evidencia: comandos, arquivos, sintomas e riscos.
- Converter recomendacoes em tasks rastreaveis.
- Manter uma fonte unica para notas de versao futuras.
- Evitar que diagnosticos importantes fiquem perdidos em conversas ou arquivos soltos.

## Estrutura

- `analises/`: relatorios completos de diagnostico e revisao.
- `observacoes/`: observacoes menores que ainda nao justificam um relatorio completo.
- `tasks/`: backlog derivado das analises, com origem e criterio de pronto.
- `releases/`: notas de versao em preparacao.
- `templates/`: modelos para novos registros.

## Convencao de IDs

- Analise: `ANA-YYYY-MM-DD-NNN`
- Observacao: `OBS-YYYY-MM-DD-NNN`
- Task: `TASK-YYYY-MM-DD-NNN`
- Nota de versao: `REL-YYYY-MM-DD` ou `UNRELEASED`

## Fluxo recomendado

1. Criar ou atualizar uma analise em `analises/`.
2. Registrar observacoes menores em `observacoes/` quando ainda nao houver diagnostico completo.
3. Extrair recomendacoes acionaveis para `tasks/backlog.md`.
4. Quando uma task for concluida, registrar evidencia objetiva: commit, PR, comando, arquivo ou teste.
5. Promover tasks concluidas para `releases/UNRELEASED.md`.
6. No fechamento de uma versao, copiar `UNRELEASED.md` para um arquivo datado em `releases/`.

## Regra de qualidade

Uma task ou item de nota de versao deve apontar para uma origem verificavel: analise, observacao, commit, PR ou comando executado. Sem origem, o item fica como hipotese e nao deve entrar como mudanca realizada.
