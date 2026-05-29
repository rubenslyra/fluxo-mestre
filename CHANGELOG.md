# Notas de Versão

## 0.1.1 - Publicação estática e limpeza pública

Data: 2026-05-28

### Adicionado

- Build estático para hospedagem compartilhada sem Node no servidor.
- Pacote de publicação em `release/fluxolab-hostinger.zip`.
- SEO completo no `index.html` para GitHub Pages e compartilhamento social.
- `manifest.webmanifest` para instalação como aplicação web progressiva.

### Alterado

- README passou a trazer instruções diretas para baixar, rodar localmente e publicar em hospedagem comum.
- Documentação interna de análise, tarefas e releases foi removida do rastreio público.

### Validação

- `bun run build:hostinger`
- `bunx tsc --noEmit`
- `bun run lint`

## 0.1.0 - Release comunitária inicial

Data: 2026-05-28

### Adicionado

- Tema claro/escuro com modo dark inspirado em Drácula e Monokai.
- Painel de configurações acessível por engrenagem.
- Preferências locais para confirmação de limpeza, redução de movimento e provedor de IA.
- Configuração opcional de API local/externa para endpoints OpenAI compatíveis e Gemini REST.
- Blueprints de geração de código para Python, C#, Java, JavaScript e C/C++.
- Introdução mobile com recomendação de uso completo em tablet, desktop ou telas maiores.
- Documentação de execução local, Docker, segurança de chaves e origem do projeto.

### Corrigido

- Erro de hidratação React #418 causado por diferenças entre estado SSR e estado inicial do cliente.
- Diálogo nativo para salvamento de template no gerador IA.
- Painel de validação extrapolando a área visível inferior do canvas.
- Exportação imprimível dos desafios usando `document.write`.
- Layout dos desafios em telas pequenas.

### Segurança e publicação

- `.gitignore` e `.dockerignore` passam a cobrir `.env`, certificados e chaves privadas.
- `.env.example` documenta que chaves reais não devem ser versionadas.
- Nginx recebe headers básicos de segurança.
- README passa a trazer autoria e origem: Rubens Lyra, @rubinholyralabs, LinkedIn @rubenslyra e
  TikTok @rubinholyralabs.

### Validação

- `bunx tsc --noEmit`
