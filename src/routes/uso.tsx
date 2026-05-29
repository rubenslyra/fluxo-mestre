import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const Route = createFileRoute("/uso")({
  component: UsagePage,
});

function UsagePage() {
  return (
    <LegalDocumentPage
      title="Termos de Uso"
      subtitle="FluxoLab — regras práticas para operar o editor e os recursos de geração."
      sections={[
        {
          title: "Uso permitido",
          icon: "use",
          paragraphs: [
            "O FluxoLab foi projetado para desenho de fluxogramas, validação lógica, geração de código e apoio didático.",
            "O uso deve respeitar a finalidade do projeto, sem tentar burlar limites locais, manipular arquivos de terceiros ou introduzir conteúdo malicioso.",
          ],
        },
        {
          title: "Responsabilidade do usuário",
          icon: "summary",
          bullets: [
            "Conferir os fluxos antes de exportar ou compartilhar.",
            "Validar os metadados usados para geração de código, UML ou SQL.",
            "Manter atenção ao que é enviado a APIs externas.",
          ],
          paragraphs: [
            "O aplicativo facilita o trabalho técnico, mas a revisão final continua sendo responsabilidade de quem utiliza a ferramenta.",
          ],
        },
        {
          title: "Exportações e IA",
          icon: "summary",
          paragraphs: [
            "As exportações criam arquivos a partir do estado atual do fluxograma. A geração por IA, quando ativada, depende das credenciais e do endpoint configurados localmente.",
            "Se o usuário optar por integrações externas, ele assume o controle do que será enviado ao provedor escolhido.",
          ],
        },
        {
          title: "Uso aceitável",
          icon: "privacy",
          paragraphs: [
            "Não utilize o app para automatizar abuso, enviar dados sensíveis sem necessidade ou produzir conteúdo que viole leis aplicáveis.",
            "O projeto continua evoluindo e estas notas servem como regra operacional prática do repositório.",
          ],
        },
      ]}
    />
  );
}
