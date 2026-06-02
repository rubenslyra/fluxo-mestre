import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const Route = createFileRoute("/cookies")({
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalDocumentPage
      title="Política de Cookies"
      subtitle="FluxoLab — o que fica salvo no navegador e para que serve."
      sections={[
        {
          title: "O que é armazenado",
          icon: "cookies",
          paragraphs: [
            "O FluxoLab pode usar armazenamento local do navegador para lembrar preferências de tema, exportação, ajustes do painel e outros estados de interface.",
            "Esse mecanismo funciona como persistência local simples para evitar que o usuário tenha de reconfigurar tudo a cada sessão.",
          ],
        },
        {
          title: "Para que serve",
          icon: "summary",
          paragraphs: [
            "A persistência local mantém o editor previsível, preserva decisões já tomadas e melhora o fluxo de trabalho entre sessões.",
            "A aplicação não depende de cookies para rastreamento publicitário e o foco é funcionalidade, não perfil de navegação.",
          ],
        },
        {
          title: "Controle do usuário",
          icon: "privacy",
          bullets: [
            "Limpar os dados do navegador remove preferências e estados salvos localmente.",
            "Desativar armazenamento local pode afetar a continuidade das configurações entre sessões.",
            "O uso básico do editor continua possível, mas algumas preferências voltam ao padrão.",
          ],
          paragraphs: [
            "Esta política resume o comportamento esperado do aplicativo no navegador. O nome é mantido por organização interna e transparência com quem usa o sistema.",
          ],
        },
        {
          title: "Observação prática",
          icon: "use",
          paragraphs: [
            "Se você usa o app em ambiente compartilhado, é recomendável limpar dados locais ao finalizar o trabalho para evitar reaproveitamento de preferências por outro usuário.",
          ],
        },
      ]}
    />
  );
}
