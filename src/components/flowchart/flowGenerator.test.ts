import { describe, expect, test } from "bun:test";
import { layoutGeneratedFlow } from "./aiLayout";
import { generateLocalFlowchart } from "./flowGenerator";
import { validateFlow } from "./validation";

function validationMessages(description: string) {
  return validateFlow(layoutGeneratedFlow(generateLocalFlowchart(description))).map(
    (issue) => issue.msg,
  );
}

describe("generateLocalFlowchart", () => {
  test("keeps every ranged grade input connected through validation and retry paths", () => {
    const generated = generateLocalFlowchart(`
      Sistema de notas do modulo.
      No teste manual, leia cada nota separadamente:
      avaliacao_1: 0 a 1;
      avaliacao_2: 0 a 2;
      avaliacao_3: 0 a 1;
      prova_regular: 0 a 6.
      Calcule a nota final e exiba o resumo.
    `);
    const doc = layoutGeneratedFlow(generated);
    const manualInputs = doc.nodes.filter(
      (node) => node.kind === "manual" && /^Ler /.test(node.label),
    );

    expect(manualInputs.length).toBeGreaterThan(4);
    for (const input of manualInputs) {
      expect(doc.edges.some((edge) => edge.to === input.id)).toBe(true);
      expect(doc.edges.some((edge) => edge.from === input.id)).toBe(true);
    }
    expect(validateFlow(doc)).toEqual([]);
  });

  test("generates a connected generic input and output flow", () => {
    expect(
      validationMessages("Ler um valor de entrada, calcular o dobro e exibir o resultado."),
    ).toEqual([]);
  });

  test("generates a connected loop flow from code-like input", () => {
    expect(
      validationMessages(`
        alunos = []
        quantidade_alunos = 3
        for aluno in range(quantidade_alunos):
          nota = random.uniform(0, 10)
          alunos.append(nota)
        for i, nota in enumerate(alunos):
          print(i, nota)
      `),
    ).toEqual([]);
  });
});
