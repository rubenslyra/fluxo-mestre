// Classificação heurística das objeções dos alunos por tipo,
// para filtros e para sugerir uma sequência socrática de condução do debate.

export type ObjectionTag =
  | "onde-vou-usar"
  | "vale-pena-desenhar"
  | "seguranca"
  | "framework-resolve"
  | "muito-simples"
  | "tecnologia-mudou"
  | "outros";

export const TAG_LABEL: Record<ObjectionTag, string> = {
  "onde-vou-usar": "Onde vou usar?",
  "vale-pena-desenhar": "Vale a pena desenhar?",
  seguranca: "Segurança / risco",
  "framework-resolve": "O framework já resolve",
  "muito-simples": "É simples / infantil demais",
  "tecnologia-mudou": "Tecnologia mudou (reduce, IA, ...)",
  outros: "Outros",
};

export const TAG_COLOR: Record<ObjectionTag, string> = {
  "onde-vou-usar": "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  "vale-pena-desenhar": "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  seguranca: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  "framework-resolve": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "muito-simples": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "tecnologia-mudou": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  outros: "bg-muted text-muted-foreground",
};

export function classifyObjection(question: string): ObjectionTag {
  const q = question.toLowerCase();
  if (/(onde|quando).*(usar|aplicar|trabalho|mercado|carreira|real)/.test(q))
    return "onde-vou-usar";
  if (
    /(desenhar|fluxograma|diagrama|vale a pena).*(direto|código|codar)?/.test(q) ||
    /pra que (desenhar|fluxograma)/.test(q)
  )
    return "vale-pena-desenhar";
  if (/(segura|seguran|brecha|fraude|invas|cve|vazament|risco)/.test(q)) return "seguranca";
  if (
    /(framework|biblioteca|lib|orm|spring|react|angular|jquery|rails).*(resolve|cuida|faz)/.test(
      q,
    ) ||
    /(não.*é.*trabalho.*do.*framework)/.test(q)
  )
    return "framework-resolve";
  if (/(infantil|simples demais|trivial|bobinho|óbvio|óbvia|crian)/.test(q)) return "muito-simples";
  if (/(reduce|map|sum|ia|copilot|chatgpt|gpt|llm|hoje em dia|antigamente|mudou|moderno)/.test(q))
    return "tecnologia-mudou";
  return "outros";
}

export type SocraticTurn = {
  role: "professor" | "aluno-imaginado" | "pergunta-socratica";
  text: string;
};

// Roteiro de condução por tipo de objeção. O professor segue como guia durante o debate em sala.
export const SOCRATIC_PLAYBOOK: Record<ObjectionTag, SocraticTurn[]> = {
  "onde-vou-usar": [
    {
      role: "professor",
      text: "Reconheça a dúvida: 'Boa, é a pergunta certa.' Nunca minimize o ceticismo.",
    },
    {
      role: "pergunta-socratica",
      text: "Pergunte de volta: 'Que software você usou hoje que NÃO precisou tomar uma decisão SE/ENTÃO?'",
    },
    {
      role: "aluno-imaginado",
      text: "Provável resposta: silêncio ou 'nenhum'. Use isso como ponte.",
    },
    {
      role: "professor",
      text: "Mostre 1 aplicação concreta do mundo real listada no card 'Onde isso aparece' que seja do interesse da turma (jogos, redes sociais, banco).",
    },
    {
      role: "pergunta-socratica",
      text: "Provoque: 'Se a estrutura é a mesma, o que muda do exercício pro mundo real — a lógica ou o nome das variáveis?'",
    },
    {
      role: "professor",
      text: "Feche: 'O exercício é o esqueleto. A regra de negócio só veste o esqueleto depois.'",
    },
  ],
  "vale-pena-desenhar": [
    {
      role: "professor",
      text: "Valide o ponto: 'Faz sentido — pra UM if realmente parece exagero.'",
    },
    {
      role: "pergunta-socratica",
      text: "Pergunte: 'E quando forem 5 ifs aninhados, com 3 ORs e 2 ANDs misturados, você ainda vai conseguir defender em code review SEM desenho?'",
    },
    {
      role: "aluno-imaginado",
      text: "Aluno tende a recuar. Aproveite para introduzir o conceito de auditoria visual.",
    },
    {
      role: "professor",
      text: "Mostre que o fluxograma serve pra DOIS momentos: antes (pensar) e depois (explicar pra outra pessoa).",
    },
    {
      role: "pergunta-socratica",
      text: "Desafie: 'Tente explicar a lógica em voz alta SEM apontar pro código. Conseguiu? Então não precisa desenhar. Travou? Desenha.'",
    },
  ],
  seguranca: [
    {
      role: "professor",
      text: "Use um caso real: cite um vazamento famoso causado por OR no lugar de AND (ou similar).",
    },
    {
      role: "pergunta-socratica",
      text: "Pergunte: 'Quantas combinações de verdadeiro/falso existem aqui? Você consegue afirmar que TODAS estão cobertas?'",
    },
    {
      role: "aluno-imaginado",
      text: "Esperado: 'acho que sim.' Acho que sim NÃO é uma resposta de segurança.",
    },
    {
      role: "professor",
      text: "Construa a tabela-verdade no quadro junto com a turma — visualmente, é impossível esconder uma combinação.",
    },
    {
      role: "pergunta-socratica",
      text: "Feche: 'O que custa mais: 5 minutos desenhando, ou 5 horas explicando vazamento pro jurídico?'",
    },
  ],
  "framework-resolve": [
    {
      role: "professor",
      text: "Concorde em parte: 'Sim, o framework EXECUTA — você ainda precisa DEFINIR a regra.'",
    },
    {
      role: "pergunta-socratica",
      text: "Pergunte: 'Se o framework resolvesse tudo, por que existem CVEs em frameworks famosos?'",
    },
    {
      role: "professor",
      text: "Mostre: middleware/decorator/guard só checa o que VOCÊ passou. Esquecer uma cláusula é responsabilidade do dev, não do framework.",
    },
    {
      role: "pergunta-socratica",
      text: "Provoque: 'Quando der bug em produção, você vai abrir issue no GitHub do framework ou vai consertar SEU código?'",
    },
  ],
  "muito-simples": [
    { role: "professor", text: "Aceite a crítica: 'É simples MESMO. Foi feito pra ser.'" },
    {
      role: "pergunta-socratica",
      text: "Pergunte: 'Se é tão simples, por que tantos profissionais erram em entrevista a pergunta FizzBuzz?'",
    },
    {
      role: "professor",
      text: "Explique: simplicidade do problema = foco total na ESTRUTURA. Adicionar regra de negócio aqui só atrapalharia.",
    },
    {
      role: "pergunta-socratica",
      text: "Desafio: 'Resolva agora SEM olhar o código, só desenhando. Se conseguir em 30 segundos, próximo nível.'",
    },
  ],
  "tecnologia-mudou": [
    {
      role: "professor",
      text: "Reconheça: 'Verdade, hoje temos reduce, map, IA, copilot. Mas...'",
    },
    {
      role: "pergunta-socratica",
      text: "Pergunte: 'Quando o copilot sugere código errado, como você sabe que está errado SEM entender a lógica por trás?'",
    },
    {
      role: "professor",
      text: "Mostre: reduce/map são AÇÚCAR sintático sobre o mesmo conceito de iteração. Quem não entende invariante de loop, escreve reduce com bug também.",
    },
    {
      role: "pergunta-socratica",
      text: "Provoque: 'Sua carreira vai durar 30 anos. Quantas linguagens vão passar nesse tempo? O que SOBRA?'",
    },
    { role: "aluno-imaginado", text: "Resposta esperada (induzida): 'a lógica.' Bingo." },
  ],
  outros: [
    {
      role: "professor",
      text: "Repita a objeção em voz alta para garantir que entendeu: 'Deixa eu ver se entendi: você está dizendo que ___?'",
    },
    {
      role: "pergunta-socratica",
      text: "Pergunte: 'O que precisaria ser verdade pra você mudar de ideia sobre esse exercício?'",
    },
    {
      role: "professor",
      text: "Use a resposta pré-pronta do card como apoio, mas adapte ao vocabulário da turma.",
    },
    {
      role: "pergunta-socratica",
      text: "Devolva: 'Como VOCÊ resolveria esse problema se tivesse que explicar pra alguém que nunca programou?'",
    },
  ],
};
