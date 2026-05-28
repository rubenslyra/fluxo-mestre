# Backlog derivado de analises

Este backlog lista tasks originadas de diagnosticos e observacoes. Cada item deve manter uma origem clara para facilitar auditoria e composicao de notas de versao.

| ID                  | Origem             | Prioridade | Status    | Task                                                                             | Criterio de pronto                                                                                                                                                        |
| ------------------- | ------------------ | ---------- | --------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TASK-2026-05-25-001 | ANA-2026-05-25-001 | Alta       | Aberta    | Corrigir conflito de EOL/Prettier.                                               | `bun run lint` passa sem erros `Delete CR`.                                                                                                                               |
| TASK-2026-05-25-002 | ANA-2026-05-25-001 | Alta       | Aberta    | Decidir posicionamento do gerador: local assistido, IA real ou fallback hibrido. | Texto da UI, comportamento e documentacao estao alinhados com a decisao.                                                                                                  |
| TASK-2026-05-25-003 | ANA-2026-05-25-001 | Media      | Aberta    | Adicionar testes focados para `flowGenerator.ts`.                                | Casos de entrada, saida, loop, decisao e codigo de notas passam em teste automatizado.                                                                                    |
| TASK-2026-05-25-004 | ANA-2026-05-25-001 | Media      | Aberta    | Validar lockfiles e definir fonte de verdade entre Bun e npm.                    | Politica registrada e lockfile secundario removido ou justificado.                                                                                                        |
| TASK-2026-05-25-005 | ANA-2026-05-25-001 | Media      | Aberta    | Validar configuracao Vite/TanStack no ambiente alvo de deploy.                   | Build/deploy alvo passa ou lacunas de plugin sao documentadas.                                                                                                            |
| TASK-2026-05-25-006 | ANA-2026-05-25-001 | Baixa      | Aberta    | Revisar alteracao manual em `src/routeTree.gen.ts`.                              | Declaracao fica em local estavel ou processo de geracao confirma que ela sera preservada.                                                                                 |
| TASK-2026-05-25-007 | OBS-2026-05-25-001 | Baixa      | Aberta    | Manter notas de versao a partir deste repo interno.                              | Itens concluidos passam a ser promovidos para `releases/UNRELEASED.md`.                                                                                                   |
| TASK-2026-05-25-008 | OBS-2026-05-25-002 | Alta       | Concluida | Criar fluxo especializado para sistema de registro de notas com menu do tester.  | Gerador cria menu com opcoes de teste manual, seed, ajuda e sair; validacao interna nao retorna issues; typecheck e build passam.                                         |
| TASK-2026-05-25-009 | OBS-2026-05-25-003 | Alta       | Concluida | Corrigir crash ao mover o canvas do editor.                                      | Handlers de mouse nao leem mais `panRef.current` dentro do updater de `setView`; typecheck e build passam.                                                                |
| TASK-2026-05-25-010 | OBS-2026-05-25-004 | Media      | Concluida | Reestruturar o enunciado exemplo de avaliacao de alunos.                         | Exemplo do painel descreve objetivo, menu, entradas, validacoes, formula e saidas; gerador reconhece lista de notas com prefixo de bullet.                                |
| TASK-2026-05-25-011 | OBS-2026-05-25-005 | Alta       | Concluida | Adicionar exportacao PDF e validar downloads.                                    | Menu aceita PNG, SVG e PDF; PDF gera A4 paisagem com margem e paginacao; browser validou blobs com assinaturas SVG, PNG e PDF.                                            |
| TASK-2026-05-25-012 | OBS-2026-05-25-006 | Alta       | Concluida | Corrigir erro de canvas tainted na exportacao.                                   | PDF nao usa mais canvas; SVG/PNG usam SVG puro sem `foreignObject`; browser validou SVG, PNG e PDF sem `SecurityError`.                                                   |
| TASK-2026-05-25-013 | OBS-2026-05-25-007 | Alta       | Concluida | Aplicar timbre RLLabs e evitar corte de simbolos na paginacao PDF.               | PDF inclui cabecalho, rodape, ID de arquivo, versao e numero de pagina; teste com fluxo alto gera varias paginas sem dividir simbolos.                                    |
| TASK-2026-05-25-014 | OBS-2026-05-25-008 | Alta       | Concluida | Criar empacotamento Docker com nginx para uso local favoritado.                  | Imagem `fluxolab:local` constroi; container `fluxolab` responde em `http://localhost:8088` com healthcheck, HTML SSR e `logo.png`.                                        |
| TASK-2026-05-25-015 | OBS-2026-05-25-009 | Alta       | Concluida | Preparar build publico em subrota `/fluxolab` de `rubinholyra.com.br`.           | Build `bun run build:fluxolab` passa; router usa base path `/fluxolab`; nginx redireciona `/` para `/fluxolab/`; HTML, CSS, JS, logo e healthchecks respondem no prefixo. |

## Status aceitos

- `Aberta`
- `Em andamento`
- `Bloqueada`
- `Concluida`
- `Cancelada`

## Campos minimos para novas tasks

- ID unico.
- Origem verificavel.
- Prioridade.
- Status.
- Criterio de pronto objetivo.
