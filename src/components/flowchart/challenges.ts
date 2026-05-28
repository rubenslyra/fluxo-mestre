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

export type StudentObjection = {
  question: string; // a pergunta crítica do aluno
  answer: string; // resposta do professor / justificativa
};

export type Challenge = {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  scenario: string;
  provocations: string[];
  steps: ChallengeStep[];
  premises: string[];
  expectedDecisions: string[];
  referenceFlow: string[];
  pitfalls: string[];
  logicConcept: string;
  // NOVOS — para responder o aluno crítico ("por que estudar isso?")
  whyItMatters: string; // justificativa pedagógica em 1-2 frases
  realWorldApplications: string[]; // 3-5 aplicações concretas no mercado
  studentObjections: StudentObjection[]; // perguntas céticas + respostas
  transferableSkill: string; // a habilidade transferível além do exercício
};

export const CHALLENGES: Challenge[] = [
  {
    id: "par-impar",
    title: "Par ou ímpar?",
    category: "Decisão simples",
    difficulty: "iniciante",
    logicConcept: "Modus Ponens — Se P → Q",
    scenario: "Um aluno entrega um número inteiro N. O sistema deve dizer se ele é par ou ímpar.",
    whyItMatters:
      "Não é sobre 'par/ímpar'. É o menor exercício possível para você dominar a estrutura SE → ENTÃO → SENÃO, que é a base de QUALQUER decisão em software.",
    realWorldApplications: [
      "Distribuir requisições entre dois servidores (load balancing round-robin) usando ID % 2.",
      "Alternar cores de linhas em tabelas (zebra striping) no front-end.",
      "Validar dígitos verificadores de CPF, CNPJ, código de barras e ISBN — todos usam paridade.",
      "Detectar bits de paridade em transmissão de dados (redes, RAM ECC).",
      "Sharding de banco de dados: decidir em qual réplica gravar conforme paridade do ID.",
    ],
    studentObjections: [
      {
        question: "Professor, quando é que eu vou usar par ou ímpar de verdade no trabalho?",
        answer:
          "Você não vai escrever 'par ou ímpar' literalmente, mas vai escrever DEZENAS de 'se condição X, faça A, senão faça B' por dia. Aqui você está treinando o músculo da decisão binária com o exemplo mais limpo possível — sem distração de regra de negócio.",
      },
      {
        question: "Mas isso é uma linha de código, vale a pena fazer fluxograma?",
        answer:
          "Sim, justamente porque é trivial. O objetivo é desacoplar o RACIOCÍNIO da SINTAXE. Quem não consegue desenhar isso, trava em problemas de 5 decisões aninhadas depois.",
      },
    ],
    transferableSkill:
      "Traduzir uma regra do mundo real em uma única pergunta booleana e mapeá-la para dois caminhos mutuamente exclusivos.",
    provocations: [
      "O que define matematicamente um número par? Você consegue traduzir isso para uma pergunta de SIM/NÃO?",
      "Quantos caminhos diferentes o fluxo precisa ter depois da decisão?",
      "Existe algum N para o qual a sua regra falha (zero, negativos)?",
    ],
    steps: [
      {
        title: "Entenda o problema",
        prompt: "Reescreva o enunciado com suas palavras em uma única frase.",
      },
      {
        title: "Liste o que entra e o que sai",
        prompt: "Qual é a entrada? Qual é a saída esperada para cada caso?",
      },
      {
        title: "Encontre a pergunta-chave",
        prompt: "Qual única pergunta booleana resolve o problema?",
        hint: "Pense em N % 2.",
      },
      {
        title: "Esboce o fluxo",
        prompt: "Desenhe: Início → Ler N → Decisão → 2 saídas → Fim.",
        hint: "Use o símbolo de Decisão (losango) com duas setas rotuladas.",
      },
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
    whyItMatters:
      "Confundir E com OU em verificação de acesso é a origem clássica de falhas de segurança (CVE) — incluindo vazamentos famosos. Aqui você treina a leitura cuidadosa de requisitos antes de codar.",
    realWorldApplications: [
      "Controle de acesso (RBAC) em qualquer sistema corporativo: SAP, ERPs, intranets.",
      "Liberação de saque em internet banking (autenticado E sessão válida E não bloqueado).",
      "Middlewares de API que decidem 200 ou 401/403.",
      "Feature flags: 'mostrar feature X se usuário é beta-tester E região é BR'.",
      "Validação 2FA: senha correta E código TOTP válido.",
    ],
    studentObjections: [
      {
        question: "Por que não usar só um if no código direto, sem desenhar?",
        answer:
          "Porque em produção 'autenticado E ativo' vira 'autenticado E ativo E não-bloqueado E sessão-válida E IP-permitido'. Quem não desenha esquece um termo e abre brecha. O fluxograma é a auditoria visual da regra.",
      },
      {
        question: "Isso não é trabalho do framework de auth?",
        answer:
          "O framework executa a regra. Você define a regra. Toda fraude conhecida em painel admin envolveu alguém escrevendo OR onde devia ser AND, ou esquecendo uma cláusula.",
      },
    ],
    transferableSkill:
      "Construir tabela-verdade mental antes de escrever condições compostas — habilidade obrigatória em qualquer revisão de código sensível.",
    provocations: [
      "Se eu trocar o E por OU, o que acontece com um usuário inexistente?",
      "Quantas combinações de verdadeiro/falso existem para duas condições? Sua decisão cobre todas?",
      "A ordem das verificações importa? Por quê?",
    ],
    steps: [
      {
        title: "Liste as premissas",
        prompt: "Quais condições precisam ser verdadeiras simultaneamente?",
      },
      {
        title: "Construa a tabela-verdade",
        prompt: "Monte mentalmente as 4 combinações possíveis.",
        hint: "Apenas 1 das 4 libera o acesso.",
      },
      {
        title: "Modele a decisão",
        prompt: "Uma decisão composta ou duas decisões em sequência? Justifique.",
      },
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
    whyItMatters:
      "Toda empresa vive de regras de negócio escritas em português ambíguo. Quem traduz mal uma frase vira o desenvolvedor que 'deu prejuízo' — desconto aplicado errado custa dinheiro real.",
    realWorldApplications: [
      "Cálculo de comissão de vendedores em CRMs (Salesforce, RD Station).",
      "Promoções condicionais em e-commerce (Magento, Shopify, VTEX).",
      "Faixas de juros em fintechs conforme tempo de relacionamento.",
      "Programas de milhagem (Smiles, Latam Pass) — pontos extras se status E período.",
      "Reajuste de planos de saúde por idade E tempo de contrato.",
    ],
    studentObjections: [
      {
        question: "Mas no trabalho a regra vem pronta do PO, eu só implemento.",
        answer:
          "Errado. O PO escreve em português. Você é responsável por identificar AMBIGUIDADES — 'mais de 12 meses' inclui o dia 365? E o cliente que era premium e cancelou ontem? Quem não decompõe a frase, implementa o bug.",
      },
      {
        question: "Por que não jogar tudo num if só e pronto?",
        answer:
          "Porque amanhã o gerente pede 'e se for Black Friday, dá 15% mesmo sem ser premium'. Se você desenhou o fluxo, sabe onde inserir a nova decisão. Se não, reescreve do zero e quebra o que funcionava.",
      },
    ],
    transferableSkill:
      "Decompor um requisito em linguagem natural em premissas atômicas testáveis — base de qualquer trabalho com analista de negócio.",
    provocations: [
      "Quantas condições estão escondidas nessa frase aparentemente simples?",
      "O que o sistema deve fazer com um cliente premium ativo há 11 meses?",
      "Onde, no fluxo, o cálculo do desconto realmente acontece — antes ou depois da decisão?",
    ],
    steps: [
      { title: "Decomponha a frase", prompt: "Sublinhe cada condição independente do enunciado." },
      { title: "Liste as entradas", prompt: "Quais dados do cliente o sistema precisa receber?" },
      {
        title: "Modele a decisão",
        prompt: "Uma decisão única com E lógico ou um encadeamento de decisões?",
      },
      {
        title: "Defina os caminhos",
        prompt: "O que acontece nos dois caminhos? Algum deles tem subpassos?",
      },
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
    whyItMatters:
      "Decisão em faixas (ranges) aparece em TODO sistema que classifica algo: risco, score, prioridade, severidade. Quem não domina o encadeamento, escreve faixas que se sobrepõem ou deixam buracos.",
    realWorldApplications: [
      "Score de crédito (Serasa, Clearsale): faixas de aprovação/análise/recusa.",
      "Triagem médica (protocolo de Manchester): vermelho, laranja, amarelo, verde, azul.",
      "SLA de tickets (Jira, ServiceNow): crítico, alto, médio, baixo conforme tempo.",
      "Faixas de imposto de renda (alíquotas progressivas).",
      "Gamificação: bronze, prata, ouro, diamante conforme pontuação.",
    ],
    studentObjections: [
      {
        question: "Não dá pra usar switch e acabou?",
        answer:
          "switch funciona pra valor exato, não pra faixa. E mesmo que use, o RACIOCÍNIO é o mesmo: garantir exaustividade (todo valor cai em algum lugar) e exclusividade (não cai em dois). É isso que o fluxograma te força a verificar.",
      },
      {
        question: "Por que sempre o exemplo da escola? Soa infantil.",
        answer:
          "Porque você JÁ conhece a regra — o esforço cognitivo fica 100% na ESTRUTURA. Trocar pra 'score de crédito' adicionaria a dificuldade de entender o domínio. Aprende-se a estrutura primeiro, aplica-se em qualquer domínio depois.",
      },
    ],
    transferableSkill:
      "Encadear N-1 decisões binárias para cobrir N faixas exclusivas e exaustivas — padrão presente em toda lógica de classificação.",
    provocations: [
      "Quantas decisões realmente são necessárias para cobrir 3 caminhos?",
      "O que acontece se você inverter a ordem das comparações?",
      "Onde você posiciona o cálculo da média no fluxo — antes ou depois das decisões?",
    ],
    steps: [
      { title: "Identifique etapas", prompt: "Separe entrada, processamento e decisão." },
      {
        title: "Encadeie decisões",
        prompt: "Como duas decisões consecutivas podem cobrir três faixas?",
      },
      {
        title: "Confira a exaustividade",
        prompt: "Toda média possível cai em exatamente um caminho?",
      },
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
    scenario: "Receba N e exiba a soma de todos os inteiros de 1 até N usando repetição.",
    whyItMatters:
      "Loop com acumulador é o esqueleto de toda agregação: somar, contar, médias, máximos. Quem não desenha a 'volta da seta', não enxerga loop infinito antes de rodar — e trava o servidor em produção.",
    realWorldApplications: [
      "Totalização de carrinho de compras (somar valores dos itens).",
      "Cálculo de saldo bancário a partir do extrato.",
      "Processamento de lote (batch) — folha de pagamento, boletos.",
      "Métricas de dashboard: contar pedidos do dia, somar receita por região.",
      "Gauss famoso: existe fórmula N(N+1)/2, mas 99% dos problemas reais NÃO têm fórmula fechada — só loop resolve.",
    ],
    studentObjections: [
      {
        question: "Mas existe a fórmula N(N+1)/2, pra que loop?",
        answer:
          "Excelente observação — e é exatamente a mentalidade que você precisa em produção (questionar antes de iterar). Mas 'somar valores dos itens do carrinho' não tem fórmula fechada. O exercício te ensina o PADRÃO acumulador, não o cálculo específico.",
      },
      {
        question: "Hoje em dia tem reduce, map, sum... pra que escrever loop?",
        answer:
          "reduce É um loop com nome bonito. Quem não entende invariante de loop, escreve reduce errado também (estado inicial errado, função acumuladora bugada). A linguagem muda, o conceito não.",
      },
    ],
    transferableSkill:
      "Identificar variável de estado, condição de parada e invariante — fundamento de qualquer iteração, recursão ou processamento de stream.",
    provocations: [
      "Qual variável muda a cada iteração? Qual permanece?",
      "O que garante que o loop termina? E se N for 0 ou negativo?",
      "Onde, no fluxograma, fica o retorno da seta para 'recomeçar'?",
    ],
    steps: [
      {
        title: "Identifique variáveis de estado",
        prompt: "Quais valores você precisa lembrar entre as iterações?",
      },
      {
        title: "Defina inicialização",
        prompt: "Use um símbolo de Preparação para os valores iniciais.",
      },
      {
        title: "Modele a condição de parada",
        prompt: "Decisão dentro do loop: continuar ou sair?",
      },
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
    whyItMatters:
      "Mensagem de erro genérica ('falha no pagamento') gera ticket de suporte e cliente perdido. Mensagem específica ('cartão bloqueado') resolve sozinha. Aqui você treina a diferença entre 'reprovar' e 'reprovar SABENDO o porquê'.",
    realWorldApplications: [
      "Gateways de pagamento (Stripe, PagSeguro, Cielo): cada erro tem código próprio.",
      "Validação de pedido em e-commerce (estoque, frete, endereço).",
      "Chatbots de atendimento que precisam dizer POR QUE não conseguem ajudar.",
      "Logs estruturados em sistemas distribuídos — diferenciar causa raiz de sintoma.",
      "Healthchecks: 'down porque DB X' é diferente de 'down genérico'.",
    ],
    studentObjections: [
      {
        question:
          "Por motivo de segurança, não é melhor mensagem genérica pra não dar dica pro fraudador?",
        answer:
          "Pergunta excelente — e a resposta é 'depende do contexto'. Em login, sim (não revelar se foi senha ou usuário). Em pagamento próprio do cliente, NÃO — ele PRECISA saber se é saldo, bloqueio ou limite. Aprender a separar os motivos te dá flexibilidade pra escolher o que expor.",
      },
    ],
    transferableSkill:
      "Pensar em CAUSA da falha, não só em SUCESSO — base de bom logging, observabilidade e UX de erro.",
    provocations: [
      "Se a aprovação falhou, qual das premissas foi negada? Como o fluxo descobre?",
      "Você precisa de uma única decisão composta ou de duas decisões separadas para distinguir os motivos?",
      "Qual conceito da lógica formal você está aplicando ao deduzir 'qual premissa falhou'?",
    ],
    steps: [
      {
        title: "Liste as premissas",
        prompt: "Quais condições precisam ser verdadeiras para aprovar?",
      },
      {
        title: "Pense no caminho do erro",
        prompt: "Como diferenciar 'saldo insuficiente' de 'cartão bloqueado'?",
      },
      {
        title: "Modele as decisões",
        prompt: "Uma sequência de decisões revela o motivo. Esboce-a.",
      },
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
    whyItMatters:
      "Fila com prioridade aparece em escalonadores de SO, brokers de mensagem (Kafka, RabbitMQ), atendimento bancário, hospitais. A ORDEM das verificações define se o sistema é justo, rápido ou quebra com fila vazia.",
    realWorldApplications: [
      "SUS / triagem hospitalar: idoso e gestante têm prioridade.",
      "Filas de impressão e processos no Linux/Windows (nice, priority).",
      "Atendimento em call centers (clientes VIP entram antes).",
      "Sistemas de embarque em aeroportos (executiva → grupo 1 → 2...).",
      "Filas de mensageria com Dead-Letter-Queue e prioridades.",
    ],
    studentObjections: [
      {
        question: "Não é só usar uma PriorityQueue da linguagem?",
        answer:
          "É — DEPOIS que você entende o que a estrutura faz por baixo. Quem usa PriorityQueue sem entender, esquece de tratar fila vazia (NullPointerException) ou bloqueia recursos. O fluxograma te força a pensar nos ESTADOS.",
      },
    ],
    transferableSkill:
      "Pensar em todos os estados possíveis de um recurso ANTES de operar sobre ele — base de programação defensiva.",
    provocations: [
      "Quantos estados possíveis a fila tem? O fluxo cobre todos?",
      "Como você decide entre fila vazia, prioritário existente, ou fila comum — sem repetir verificações?",
      "O que essa lógica tem a ver com 'tautologia, contradição e contingência'?",
    ],
    steps: [
      { title: "Mapeie os estados", prompt: "Liste todos os estados possíveis da fila." },
      {
        title: "Encadeie decisões",
        prompt: "Qual a ordem mais eficiente de verificar cada estado?",
      },
      {
        title: "Esboce o fluxo",
        prompt: "Use Decisão para cada bifurcação e Sub-rotina para 'Chamar cliente'.",
      },
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
    whyItMatters:
      "Validação é a primeira linha de defesa do sistema contra dado lixo, ataque e bug downstream. Misturar E/OU sem parênteses mentais é a causa #1 de cadastros que entram quebrados no banco.",
    realWorldApplications: [
      "Cadastro de cliente em qualquer SaaS (regras LGPD, KYC).",
      "Validação de formulário de imposto (Receita Federal exige campos condicionais).",
      "Onboarding em fintechs/bancos digitais (CPF OU passaporte para estrangeiros).",
      "Checkout: precisa endereço E (cartão OU pix OU boleto).",
      "Schemas de Zod, Yup, Joi — todos materializam essa lógica.",
    ],
    studentObjections: [
      {
        question: "O HTML5 já valida required, type='email', minlength... pra que isso tudo?",
        answer:
          "HTML5 valida no NAVEGADOR — qualquer um abre o DevTools e burla. Validação real é no servidor, e LÁ você precisa escrever a regra inteira. Quem confia só em front, recebe SQL injection no banco.",
      },
      {
        question: "Bibliotecas como Zod/Yup já fazem isso, por que aprender manualmente?",
        answer:
          "Porque você vai LER o schema de outra pessoa e precisa entender se a regra está correta antes de aprovar PR. Sem treino de lógica, você aprova bug com cara de código bonito.",
      },
    ],
    transferableSkill:
      "Combinar conjunções, disjunções e agrupamentos com clareza — habilidade obrigatória em validação, queries SQL/WHERE, e regras de permissão.",
    provocations: [
      "Quais condições são obrigatórias e quais são alternativas? Como o fluxo trata isso?",
      "Quantas decisões mínimas você precisa? Existe forma de paralelizar mentalmente?",
      "Se você usar uma única decisão gigante, qual problema didático isso causa?",
    ],
    steps: [
      {
        title: "Separe obrigatórias de alternativas",
        prompt: "Marque quais condições estão ligadas por E e quais por OU.",
      },
      {
        title: "Modele cada validação",
        prompt: "Uma decisão por regra ou agrupar? Qual a vantagem didática de cada abordagem?",
      },
      {
        title: "Defina o caminho do erro",
        prompt: "O fluxo deve dizer qual campo falhou ou só 'inválido'?",
      },
    ],
    premises: [
      "nome (string)",
      "email (string)",
      "senha (string)",
      "telefone (string)",
      "cpf (string)",
    ],
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
