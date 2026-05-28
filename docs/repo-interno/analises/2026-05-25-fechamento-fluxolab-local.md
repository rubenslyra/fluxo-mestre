# ANA-2026-05-25-002 - Fechamento FluxoLab local

Data: 2026-05-25
Status: Registrada

## Resumo

Fechamento das atividades do ciclo local do FluxoLab. O projeto ficou funcional para uso local via navegador, com exportacao PDF corrigida, timbre RLLabs, logo em `public/logo.png`, e empacotamento Docker com nginx na frente do servidor Bun/TanStack Start.

## Entregas concluídas

- Repo interno criado em `docs/repo-interno/` para analises, observacoes, tasks e notas de versao.
- Gerador local especializado para sistema de registro de notas de modulo.
- Correção do crash `Cannot read properties of null (reading 'vx')`.
- Reestruturação do enunciado de avaliação de alunos.
- Exportação em PNG, SVG e PDF.
- Correção do erro `Tainted canvases may not be exported`.
- PDF com timbre RLLabs, ID de arquivo, versão, número de página e paginação que não divide símbolos.
- Uso de `public/logo.png` no PDF com redução em runtime para evitar embutir o bitmap original grande.
- Dockerfile, docker-compose e nginx para acesso local em `http://localhost:8088/`.

## Validações registradas

- `bunx eslint src/components/flowchart/exportImage.ts`
- `bunx tsc --noEmit --pretty false`
- `bun run build`
- `docker build -t fluxolab:local .`
- `docker compose config`
- Container `fluxolab` healthy em `http://localhost:8088/`.
- `200` em `/healthz`, `/` e `/logo.png`.

## Estado operacional

- Container atual: `fluxolab`.
- Imagem local: `fluxolab:local`.
- URL local recomendada para favorito: `http://localhost:8088/`.
- Comandos úteis:
  - Subir/recriar: `docker compose up -d --build`
  - Parar: `docker compose down`

## Proxima etapa

Preparar o build para funcionar como funcionalidade dentro da rota publica `rubinholyra.com.br/fluxolab`. A task aberta para retomada é `TASK-2026-05-25-015`.
