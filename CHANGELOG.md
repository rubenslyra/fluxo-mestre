# Notas de Versão

## 0.2.0 - Fluxo estruturado, release comunitária e limpeza profunda

Data: 2026-06-02

### Adicionado

- Arestas tipadas para fluxo padrão, caminhos verdadeiro/falso, laços e retornos.
- Portas de conexão nos quatro lados dos nós, com indicadores visuais menores e suporte a reconexão.
- Curvas automáticas para arestas paralelas, fan-out, retornos e endpoints livres.
- Agrupadores como regiões semânticas usadas por validação, geração de código e exportações.
- Inspector de texto dos nós com alinhamento, fonte, tamanho, entrelinha e formato de lista.
- Aba "Boas Práticas" com documentações oficiais e livros técnicos recomendados.
- Metadados públicos de versão e licença em exportações, HTML e cabeçalhos do app.

### Alterado

- Geradores de código reestruturados para emitir controle de fluxo mais fiel ao desenho.
- README reorganizado para refletir a release atual, comandos de validação e publicação.
- Licença do projeto alinhada para `CC-BY-NC-SA-4.0`.
- Dependências e componentes de UI removidos quando não usados pelo aplicativo.
- `package.json` alinhado para a versão `0.2.0`.

### Removido

- Componentes UI não utilizados, lockfile npm antigo, configuração Wrangler e imagens de exemplo pesadas fora do fluxo público.

### Validação

- `bun run test`
- `bunx tsc --noEmit`
- `bun run lint`

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
