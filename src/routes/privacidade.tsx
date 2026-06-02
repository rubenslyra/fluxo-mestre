import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const Route = createFileRoute("/privacidade")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Política de Privacidade"
      subtitle="FluxoLab — como o aplicativo trata dados locais e interações do navegador."
      sections={[
        {
          title: "O que o aplicativo coleta",
          icon: "privacy",
          paragraphs: [
            "O FluxoLab não exige conta para uso básico e não depende de backend para editar fluxogramas. O trabalho principal acontece no navegador do usuário.",
            "As informações digitadas em fluxos, preferências de tema, opções de exportação e ajustes de interface podem ser armazenadas localmente para manter a sessão consistente.",
          ],
        },
        {
          title: "Onde os dados ficam",
          icon: "summary",
          paragraphs: [
            "Os dados usados pelo editor permanecem no navegador por meio de armazenamento local. Isso inclui o documento atual, preferências e itens de apoio que o usuário tenha salvo explicitamente.",
            "Se a aplicação estiver configurada para integração com IA externa, o conteúdo enviado segue as configurações escolhidas no painel correspondente.",
          ],
        },
        {
          title: "Uso de terceiros",
          icon: "privacy",
          paragraphs: [
            "Serviços externos só entram em cena se o usuário ativar um provedor de IA e fornecer endpoint ou chave compatível. Nesse caso, o envio de conteúdo segue a configuração local definida pelo próprio usuário.",
            "A documentação interna do repositório serve para orientar o uso e não substitui consulta jurídica formal.",
          ],
        },
        {
          title: "Boas práticas",
          icon: "summary",
          bullets: [
            "Não compartilhe chaves reais em repositórios públicos.",
            "Revise os fluxos antes de exportar ou enviar para serviços externos.",
            "Use o modo local quando quiser evitar envio de dados para APIs.",
          ],
          paragraphs: [
            "O objetivo desta política é explicar, de forma direta, como o app foi desenhado para trabalhar localmente e com mínima coleta.",
          ],
        },
      ]}
    />
  );
}
