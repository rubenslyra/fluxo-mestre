# Indice de observacoes

Use este arquivo para registrar fatos menores que podem virar analise depois.

| ID                 | Data       | Area                   | Observacao                                                                                                                                                              | Origem                                                          | Status     |
| ------------------ | ---------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- |
| OBS-2026-05-25-001 | 2026-05-25 | Processo               | Criada estrutura interna para analises, tasks e notas de versao.                                                                                                        | Pedido do usuario em 2026-05-25                                 | Registrada |
| OBS-2026-05-25-002 | 2026-05-25 | Gerador de fluxogramas | O caso de registro de notas precisa representar um sistema com menu para tester, teste manual com 5 alunos, seed com 100 alunos, ajuda e saida.                         | Pedido do usuario em 2026-05-25                                 | Convertida |
| OBS-2026-05-25-003 | 2026-05-25 | Editor de fluxogramas  | O editor quebrava ao arrastar o canvas quando `panRef.current` era limpo antes do updater de estado ler `vx`/`vy`.                                                      | Erro reportado: `Cannot read properties of null (reading 'vx')` | Convertida |
| OBS-2026-05-25-004 | 2026-05-25 | Gerador de fluxogramas | O enunciado exemplo de avaliacao de alunos precisava ser reestruturado como especificacao de sistema, separando objetivo, menu, entradas, validacoes, calculo e saidas. | Pedido do usuario em 2026-05-25                                 | Convertida |
| OBS-2026-05-25-005 | 2026-05-25 | Exportacao             | As opcoes de download precisavam ser verificadas e a exportacao em PDF deveria gerar paginas configuradas para impressao.                                               | Pedido do usuario em 2026-05-25                                 | Convertida |
| OBS-2026-05-25-006 | 2026-05-25 | Exportacao             | A impressao em PDF falhava com `Tainted canvases may not be exported` porque o PDF dependia de canvas renderizado a partir de SVG com `foreignObject`.                  | Erro reportado pelo usuario em 2026-05-25                       | Convertida |
| OBS-2026-05-25-007 | 2026-05-25 | Exportacao             | O PDF precisava de timbre RLLabs e paginacao que preserva simbolos inteiros, permitindo apenas conexoes continuadas entre paginas.                                      | Pedido do usuario em 2026-05-25                                 | Convertida |
| OBS-2026-05-25-008 | 2026-05-25 | Deploy local           | O projeto precisa rodar em container Docker com nginx para acesso local estavel pelo navegador, incluindo o bitmap `public/logo.png`.                                   | Pedido do usuario em 2026-05-25                                 | Convertida |
| OBS-2026-05-25-009 | 2026-05-25 | Deploy publico         | Proxima etapa definida: preparar build para rodar como funcionalidade em `rubinholyra.com.br/fluxolab`.                                                                 | Fechamento do usuario em 2026-05-25                             | Convertida |

## Quando usar observacao

- Sinal tecnico pequeno, mas recorrente.
- Decisao operacional que precisa ficar registrada.
- Evidencia ainda insuficiente para uma analise completa.
- Risco percebido que precisa de acompanhamento.
