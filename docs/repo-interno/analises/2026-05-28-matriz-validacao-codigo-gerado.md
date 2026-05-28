# Matriz de validacao do codigo gerado

ID: `ANA-2026-05-28-001`  
Data: `2026-05-28`  
Autor: `Codex`  
Status: `Rascunho`  
Escopo: `gerador de codigo por blueprint em src/components/flowchart/codeBlueprints.ts`

## Pergunta de analise

Como validar de forma objetiva se o codigo gerado pelo FluxoLab esta correto o suficiente para ser entregue ao usuario como ponto de partida util, sem vender a saida como infalivel?

## Fontes consultadas

- Arquivos:
  - `src/components/flowchart/codeBlueprints.ts`
  - `src/components/flowchart/CodeGeneratorPanel.tsx`
  - `src/components/flowchart/types.ts`
  - `docs/repo-interno/tasks/backlog.md`
- Comandos:
  - `rg -n "blueprint|code generator|generated code|validation|testes|exemplo" src docs README.md`
  - `Get-Content src/components/flowchart/codeBlueprints.ts`
  - `Get-Content src/components/flowchart/CodeGeneratorPanel.tsx`
- Evidencias externas:
  - Nenhuma. Esta analise e baseada apenas no repositorio local.

## Achados

1. A geracao e deterministica.
2. O formato depende de duas dimensoes principais: linguagem e blueprint.
3. O risco real nao e "crash", e sim gerar estrutura sintaticamente plausivel, mas semanticamente errada.
4. O repositorio ainda nao possui suite automatizada especifica para o gerador de codigo.

## Diagnostico

O gerador pode ser tratado como um sistema deterministico de transformacao de fluxograma em texto. Isso permite validar a saida com testes por fixture, sem depender de IA nem de infraestrutura externa.

A validacao precisa cobrir tres niveis:

1. Estrutura minima.
2. Regras especificas da linguagem.
3. Fidelidade ao fluxo de entrada.

## Matriz

### 1. Nivel estrutural

Critério: toda saida deve existir, nao ser vazia e conter um ponto de entrada coerente.

| Caso | Linguagem | Blueprint | Esperado |
| ---- | --------- | --------- | -------- |
| S-01 | Todas | Todas | Codigo nao vazio, com titulo/identificador derivados do fluxo. |
| S-02 | Todas | Todas | Nomes derivados dos nos sem acentos e sem caracteres invalidos. |
| S-03 | Todas | Todas | Labels vazias usam fallback padrao do simbolo. |

### 2. Nivel linguistico

Critério: a saida deve respeitar a forma basica da linguagem.

| Caso | Linguagem | Esperado |
| ---- | --------- | -------- |
| L-01 | Python | `def`, `class`, `if __name__ == "__main__"` quando aplicavel. |
| L-02 | C# | `class`, `public`, `static`, `using` coerentes com o blueprint. |
| L-03 | Java | `class`, `public final`, `import java.util.*;` coerente com o blueprint. |
| L-04 | JavaScript | `export class`, `export function`, `const` coerentes com o blueprint. |
| L-05 | C/C++ | `#include`, `struct`, `class`, `std::` ou equivalente coerente com o blueprint. |

### 3. Nivel de blueprint

Critério: cada blueprint precisa carregar sua estrutura conceitual.

| Caso | Blueprint | Esperado |
| ---- | --------- | -------- |
| B-01 | `procedural` | Funcoes soltas ou sequencia direta de chamadas. |
| B-02 | `template-method` | Classe base com algoritmo fixo e metodos sobrescritos. |
| B-03 | `strategy` | Estrategia injetavel para decisoes/politicas. |
| B-04 | `command-pipeline` | Lista/pipeline de comandos executaveis em sequencia. |

### 4. Nivel semantico

Critério: a saida precisa refletir o desenho do fluxograma, nao apenas formatar texto.

| Caso | Fixture de entrada | Esperado |
| ---- | ------------------ | -------- |
| M-01 | Fluxo linear simples | Sequencia de passos preservada na ordem do grafo. |
| M-02 | Fluxo com decisao | Pelo menos uma marca clara de decisao ou estrategia. |
| M-03 | Fluxo com loop | Ha indicios de repeticao/encadeamento e nao ha perda de no de retorno. |
| M-04 | Fluxo com simbolos acentuados | Nomes gerados sao normalizados sem quebrar o codigo. |
| M-05 | Fluxo com labels longas | Nomes continuam validos e sem truncamento perigoso. |
| M-06 | Fluxo desconectado | Componentes fora da rota principal ainda aparecem na saida. |

### 5. Nivel de robustez

Critério: entradas ruins ou ambiguas nao podem quebrar a geracao.

| Caso | Entrada | Esperado |
| ---- | ------- | -------- |
| R-01 | Documento vazio | Saida minima segura ou erro explicito e controlado. |
| R-02 | No sem label | Fallback padrao do simbolo. |
| R-03 | Rotulo repetido em varios nos | Nomes unicos gerados por indice. |
| R-04 | Texto com caracteres reservados | Escape ou normalizacao suficiente para compilar. |

## Criterio de aprovacao

- Criticos: todos os casos `S`, `L` e `B` devem passar.
- Importantes: pelo menos 5 de 6 casos `M` devem passar, sem falha nos casos M-01, M-02 e M-04.
- Desejavel: todos os casos `R` devem passar.

## Instrumentacao sugerida

1. Testes unitarios em fixture pura para `generateCode`.
2. Snapshots por combinacao `(linguagem, blueprint)`.
3. Assercoes por regex para forma basica da linguagem.
4. Se possivel, validacao de compilacao/sintaxe em pelo menos Python, JavaScript e C#.
5. Registro de fixtures fixas para regressao:
   - fluxo linear de 3 passos;
   - fluxo com decisao sim/nao;
   - fluxo com loop;
   - fluxo com acentos e labels longas;
   - documento vazio ou incompleto.

## Recomendacao

Tratar a saida como "boa se passar na matriz", nao como "correta por definicao". Essa matriz da uma base objetiva para evoluir o gerador sem depender de julgamentos subjetivos de cada codigo emitido.
