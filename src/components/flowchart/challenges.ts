// Catálogo de desafios para provocar pensamento lógico antes da codificação.
// Inspirado em "Fundamentos da Lógica Formal Aplicados ao Desenvolvimento de Software" (Rubens Lyra)
// e na ISO 5807. Cada desafio guia o aluno por: entender → questionar → decompor →
// modelar premissas → esboçar fluxo → comparar com referência.

export type Difficulty = "iniciante" | "intermediário" | "avançado";

export type ChallengeStep = {
  title: string;
  prompt: string; // pergunta provocativa
  hint?: string; // dica que aparece sob demanda
};

export type Challenge = {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  scenario: string; // narrativa do problema
  provocations: string[]; // perguntas socráticas para destravar o aluno
  steps: ChallengeStep[]; // roteiro guiado
  premises: string[]; // o que se sabe (premissas/entradas)
  expectedDecisions: string[]; // decisões que o fluxo precisa conter
  referenceFlow: string[]; // esqueleto textual do fluxograma esperado
  pitfalls: string[]; // armadilhas comuns (||/&&, terceiro excluído, etc.)
  logicConcept: string; // conceito lógico em jogo
};

export const CHALLENGES: Challenge[] = [
  {
    id: "par-impar",
    title: "Par ou ímpar?",
    category: "Decisão simples",
    difficulty: "iniciante",
    logicConcept: "Modus Ponens — Se P → Q",
    scenario:
      "Um aluno entrega um número inteiro N. O sistema deve dizer se ele é par ou ímpar.",
    provocations: [
      "O que define matematicamente um número par? Você consegue traduzir isso para uma pergunta de SIM/NÃO?",
      "Quantos caminhos diferentes o fluxo precisa ter depois da decisão?",
      "Existe algum N para o qual a sua regra falha (zero, negativos)?",
    ],
    steps: [
      { title: "Entenda o problema", prompt: "Reescreva o enunciado com suas palavras em uma única frase." },
      { title: "Liste o que entra e o que sai", prompt: "Qual é a entrada? Qual é a saída esperada para cada caso?" },
      { title: "Encontre a pergunta-chave", prompt: "Qual única pergunta booleana resolve o problema?", hint: "Pense em N % 2." },
      { title: "Esboce o fluxo", prompt: "Desenhe: Início → Ler N → Decisão → 2 saídas → Fim.", hint: "Use o símbolo de Decisão (losango) com duas setas rotuladas." },
    ],
    premises: ["N é um número inteiro fornecido pelo usuário"],
    expectedDecisions: ["N % 2 == 0 ?"],
    referenceFlow: [
      "Início (terminator)",
      "Ler N (entrada manual)",
      "Decisão: N % 2 == 0 ?",
      "Sim → Exibir 'Par'",
      "Não → Exibir 'Ímpar'",
      "Fim (terminator)",
    ],
    pitfalls: [
      "Esquecer o caso N = 0 (é par).",
      "Criar duas decisões separadas quando uma só basta.",
      "Não rotular as setas Sim/Não.",
    ],
  },
  {
    id: "login-seguro",
    title: "Liberar acesso ao painel",
    category: "Regra de negócio",
    difficulty: "iniciante",
    logicConcept: "Operadores E (&&) vs OU (||) — short-circuit",
    scenario:
      "Só pode entrar no painel administrativo quem está autenticado E tem perfil ativo. Caso contrário, deve ver uma mensagem de erro.",
    provocations: [
      "Se eu trocar o E por OU, o que acontece com um usuário inexistente?",
      "Quantas combinações de verdadeiro/falso existem para duas condições? Sua decisão cobre todas?",
      "A ordem das verificações importa? Por quê?",
    ],
    steps: [
      { title: "Liste as premissas", prompt: "Quais condições precisam ser verdadeiras simultaneamente?" },
      { title: "Construa a tabela-verdade", prompt: "Monte mentalmente as 4 combinações possíveis.", hint: "Apenas 1 das 4 libera o acesso." },
      { title: "Modele a decisão", prompt: "Uma decisão composta ou duas decisões em sequência? Justifique." },
      { title: "Esboce o fluxo", prompt: "Desenhe e rotule as duas saídas claramente." },
    ],
    premises: [
      "usuario.Autenticado é booleano",
      "usuario.Ativo é booleano",
      "usuario pode ser nulo",
    ],
    expectedDecisions: ["usuario != null && usuario.Autenticado && usuario.Ativo"],
    referenceFlow: [
      "Início",
      "Ler usuário",
      "Decisão: autenticado E ativo?",
      "Sim → Liberar painel",
      "Não → Exibir mensagem de erro",
      "Fim",
    ],
    pitfalls: [
      "Usar || em vez de && — libera acesso indevido.",
      "Verificar Ativo antes de checar se o objeto existe (NullReference).",
      "Esquecer de tratar o caminho 'erro'.",
    ],
  },
  {
    id: "desconto-premium",
    title: "Desconto para cliente premium",
    category: "Tradução de regra de negócio",
    difficulty: "intermediário",
    logicConcept: "Conjunção de múltiplas premissas — silogismo composto",
    scenario:
      "“Clientes premium, ativos há mais de 12 meses, recebem 10% de desconto.” Modele o fluxo que decide aplicar ou não o desconto sobre o valor da compra.",
    provocations: [
      "Quantas condições estão escondidas nessa frase aparentemente simples?",
      "O que o sistema deve fazer com um cliente premium ativo há 11 meses?",
      "Onde, no fluxo, o cálculo do desconto realmente acontece — antes ou depois da decisão?",
    ],
    steps: [
      { title: "Decomponha a frase", prompt: "Sublinhe cada condição independente do enunciado." },
      { title: "Liste as entradas", prompt: "Quais dados do cliente o sistema precisa receber?" },
      { title: "Modele a decisão", prompt: "Uma decisão única com E lógico ou um encadeamento de decisões?" },
      { title: "Defina os caminhos", prompt: "O que acontece nos dois caminhos? Algum deles tem subpassos?" },
    ],
    premises: [
      "cliente.Premium (bool)",
      "cliente.Ativo (bool)",
      "cliente.MesesDeConta (int)",
      "valorCompra (decimal)",
    ],
    expectedDecisions: ["cliente.Premium && cliente.Ativo && cliente.MesesDeConta > 12"],
    referenceFlow: [
      "Início",
      "Ler cliente e valorCompra",
      "Decisão: premium E ativo E meses > 12?",
      "Sim → Calcular desconto (processo) → Exibir total com desconto",
      "Não → Exibir total sem desconto",
      "Fim",
    ],
    pitfalls: [
      "Usar >= 12 quando o enunciado diz 'mais de 12'.",
      "Aplicar desconto antes de validar todas as condições.",
      "Esconder o cálculo dentro da decisão em vez de usar um símbolo de Processo.",
    ],
  },
  {
    id: "media-aluno",
    title: "Aprovado, recuperação ou reprovado",
    category: "Decisão em cascata",
    difficulty: "intermediário",
    logicConcept: "Princípio do terceiro excluído aplicado a faixas",
    scenario:
      "Dadas duas notas, calcule a média. Se média ≥ 7 → Aprovado. Se 5 ≤ média < 7 → Recuperação. Caso contrário → Reprovado.",
    provocations: [
      "Quantas decisões realmente são necessárias para cobrir 3 caminhos?",
      "O que acontece se você inverter a ordem das comparações?",
      "Onde você posiciona o cálculo da média no fluxo — antes ou depois das decisões?",
    ],
    steps: [
      { title: "Identifique etapas", prompt: "Separe entrada, processamento e decisão." },
      { title: "Encadeie decisões", prompt: "Como duas decisões consecutivas podem cobrir três faixas?" },
      { title: "Confira a exaustividade", prompt: "Toda média possível cai em exatamente um caminho?" },
    ],
    premises: ["nota1, nota2 são números reais entre 0 e 10"],
    expectedDecisions: ["media >= 7", "media >= 5"],
    referenceFlow: [
      "Início",
      "Ler nota1, nota2 (entrada manual)",
      "Calcular media = (nota1 + nota2) / 2 (processo)",
      "Decisão: media >= 7? Sim → Exibir 'Aprovado'",
      "Não → Decisão: media >= 5? Sim → Exibir 'Recuperação'",
      "Não → Exibir 'Reprovado'",
      "Fim",
    ],
    pitfalls: [
      "Usar > em vez de >= e perder o limite exato.",
      "Criar 3 decisões redundantes em vez de 2 encadeadas.",
      "Calcular a média dentro do losango.",
    ],
  },
  {
    id: "contador-loop",
    title: "Somar de 1 até N",
    category: "Repetição",
    difficulty: "intermediário",
    logicConcept: "Invariante de loop — preparação e condição de parada",
    scenario:
      "Receba N e exiba a soma de todos os inteiros de 1 até N usando repetição.",
    provocations: [
      "Qual variável muda a cada iteração? Qual permanece?",
      "O que garante que o loop termina? E se N for 0 ou negativo?",
      "Onde, no fluxograma, fica o retorno da seta para 'recomeçar'?",
    ],
    steps: [
      { title: "Identifique variáveis de estado", prompt: "Quais valores você precisa lembrar entre as iterações?" },
      { title: "Defina inicialização", prompt: "Use um símbolo de Preparação para os valores iniciais." },
      { title: "Modele a condição de parada", prompt: "Decisão dentro do loop: continuar ou sair?" },
    ],
    premises: ["N é inteiro >= 0"],
    expectedDecisions: ["i <= N ?"],
    referenceFlow: [
      "Início",
      "Ler N",
      "Preparação: soma=0, i=1",
      "Decisão: i <= N ?",
      "Sim → Processo: soma = soma + i; i = i + 1 → volta para a Decisão",
      "Não → Exibir soma → Fim",
    ],
    pitfalls: [
      "Esquecer de incrementar i (loop infinito).",
      "Inicializar soma dentro do loop (zera a cada iteração).",
      "Usar i < N em vez de i <= N e perder o último valor.",
    ],
  },
  {
    id: "saldo-suficiente",
    title: "Aprovar pagamento",
    category: "Modus Tollens / debugging",
    difficulty: "intermediário",
    logicConcept: "Modus Tollens — negar o consequente",
    scenario:
      "Um pagamento só pode ser aprovado se o saldo do cliente for suficiente E o cartão não estiver bloqueado. Se for negado, o motivo correto deve ser informado.",
    provocations: [
      "Se a aprovação falhou, qual das premissas foi negada? Como o fluxo descobre?",
      "Você precisa de uma única decisão composta ou de duas decisões separadas para distinguir os motivos?",
      "Qual conceito da lógica formal você está aplicando ao deduzir 'qual premissa falhou'?",
    ],
    steps: [
      { title: "Liste as premissas", prompt: "Quais condições precisam ser verdadeiras para aprovar?" },
      { title: "Pense no caminho do erro", prompt: "Como diferenciar 'saldo insuficiente' de 'cartão bloqueado'?" },
      { title: "Modele as decisões", prompt: "Uma sequência de decisões revela o motivo. Esboce-a." },
    ],
    premises: ["cliente.Saldo (decimal)", "cartao.Bloqueado (bool)", "valorCompra (decimal)"],
    expectedDecisions: ["cartao.Bloqueado?", "cliente.Saldo >= valorCompra?"],
    referenceFlow: [
      "Início",
      "Ler cliente, cartão, valorCompra",
      "Decisão: cartão bloqueado? Sim → Exibir 'Cartão bloqueado' → Fim",
      "Não → Decisão: saldo >= valor? Sim → Processar pagamento → Exibir 'Aprovado'",
      "Não → Exibir 'Saldo insuficiente'",
      "Fim",
    ],
    pitfalls: [
      "Juntar tudo numa decisão composta e perder a mensagem específica.",
      "Trocar a ordem e processar pagamento antes de verificar bloqueio.",
      "Esquecer de finalizar (Fim) em algum dos ramos.",
    ],
  },
  {
    id: "fila-atendimento",
    title: "Próximo da fila",
    category: "Estrutura de dados + decisão",
    difficulty: "avançado",
    logicConcept: "Contingência — comportamento depende do estado",
    scenario:
      "Um sistema de atendimento chama o próximo cliente da fila. Se a fila estiver vazia, exibir aviso. Se houver cliente prioritário, ele vem antes dos demais.",
    provocations: [
      "Quantos estados possíveis a fila tem? O fluxo cobre todos?",
      "Como você decide entre fila vazia, prioritário existente, ou fila comum — sem repetir verificações?",
      "O que essa lógica tem a ver com 'tautologia, contradição e contingência'?",
    ],
    steps: [
      { title: "Mapeie os estados", prompt: "Liste todos os estados possíveis da fila." },
      { title: "Encadeie decisões", prompt: "Qual a ordem mais eficiente de verificar cada estado?" },
      { title: "Esboce o fluxo", prompt: "Use Decisão para cada bifurcação e Sub-rotina para 'Chamar cliente'." },
    ],
    premises: ["fila.Quantidade (int)", "fila.TemPrioritario (bool)"],
    expectedDecisions: ["fila vazia?", "tem prioritário?"],
    referenceFlow: [
      "Início",
      "Decisão: fila vazia? Sim → Exibir 'Sem clientes' → Fim",
      "Não → Decisão: tem prioritário? Sim → Sub-rotina: Chamar prioritário",
      "Não → Sub-rotina: Chamar próximo da fila",
      "Exibir senha → Fim",
    ],
    pitfalls: [
      "Verificar prioritário antes de checar fila vazia (acesso indevido).",
      "Repetir a chamada de 'Chamar cliente' em vez de usar Sub-rotina.",
      "Não convergir os caminhos antes do Fim.",
    ],
  },
  {
    id: "validacao-formulario",
    title: "Validar formulário de cadastro",
    category: "Tradução de regras compostas",
    difficulty: "avançado",
    logicConcept: "Conjunção, disjunção e short-circuit responsável",
    scenario:
      "Um formulário só é válido se: nome não estiver vazio E e-mail tiver '@' E senha tiver 8+ caracteres E (telefone OU cpf preenchido).",
    provocations: [
      "Quais condições são obrigatórias e quais são alternativas? Como o fluxo trata isso?",
      "Quantas decisões mínimas você precisa? Existe forma de paralelizar mentalmente?",
      "Se você usar uma única decisão gigante, qual problema didático isso causa?",
    ],
    steps: [
      { title: "Separe obrigatórias de alternativas", prompt: "Marque quais condições estão ligadas por E e quais por OU." },
      { title: "Modele cada validação", prompt: "Uma decisão por regra ou agrupar? Qual a vantagem didática de cada abordagem?" },
      { title: "Defina o caminho do erro", prompt: "O fluxo deve dizer qual campo falhou ou só 'inválido'?" },
    ],
    premises: ["nome (string)", "email (string)", "senha (string)", "telefone (string)", "cpf (string)"],
    expectedDecisions: ["nome preenchido?", "e-mail tem @?", "senha >= 8?", "telefone OU cpf?"],
    referenceFlow: [
      "Início",
      "Ler campos do formulário",
      "Decisão: nome preenchido? Não → Exibir erro → Fim",
      "Sim → Decisão: e-mail válido? Não → Exibir erro → Fim",
      "Sim → Decisão: senha >= 8? Não → Exibir erro → Fim",
      "Sim → Decisão: telefone OU cpf preenchido? Não → Exibir erro → Fim",
      "Sim → Salvar cadastro → Exibir sucesso → Fim",
    ],
    pitfalls: [
      "Misturar && e || sem parênteses mentais — vira tautologia ou contradição.",
      "Validar tudo numa decisão só e perder a mensagem específica.",
      "Esquecer que strings nulas e vazias são casos diferentes.",
    ],
  },
];
