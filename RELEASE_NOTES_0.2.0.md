# FluxoLab v0.2.0 - Fluxo estruturado e release comunitária

Data: 2026-06-02

Esta release consolida a evolução do FluxoLab depois da `v0.1.4`: editor mais preciso, geração de código orientada por fluxo estruturado, exportações com metadados, painel de boas práticas e limpeza profunda de dependências.

## Destaques

### Setas tipadas e portas de conexão

- Arestas semânticas: `default`, `true`, `false`, `loop` e `return`.
- Portas de conexão nos quatro lados dos nós.
- Indicadores visuais menores para manter o canvas legível.
- Suporte a reconectar arestas e manter caminhos pendentes intencionais.

### Curvas automáticas

- Separação visual de arestas paralelas e fan-out.
- Rotas mais suaves para laços e retornos.
- Endpoints livres incluídos no cálculo de limites e exportação.

### Grupos e fluxo estruturado

- Agrupadores tratados como regiões semânticas, não como passos executáveis.
- Geração de código mais fiel a decisões, laços e regiões.
- Saída para Python, C#, Java, JavaScript, C/C++, PlantUML e SQL.

### Texto e exportação

- Estilo de texto por nó: alinhamento, fonte, tamanho, entrelinha e listas.
- Exportações SVG, PNG e PDF com melhor preservação de texto.
- PDF com versão do sistema e licença comunitária.

### Documentação e licença

- README reestruturado para uso, build, publicação e segurança.
- Changelog atualizado para `0.2.0`.
- Licença pública alinhada para `CC-BY-NC-SA-4.0`.
- Aba "Boas Práticas" com documentação oficial e referências técnicas.

## Limpeza

- Removidos componentes UI que não eram importados pelo app.
- Removidas dependências Radix/shadcn não utilizadas.
- Removidos `package-lock.json`, `wrangler.jsonc` e imagens de exemplo pesadas.
- Mantido apenas `@radix-ui/react-select`, usado pelo editor.

## Validação

```bash
bun run test
bunx tsc --noEmit
bun run lint
```

Resultado esperado da release:

- 36 testes passando.
- TypeScript sem erros.
- ESLint sem erros.

## Docker

Imagem esperada:

```bash
docker pull rubenslyra/fluxolab:0.2.0
docker pull rubenslyra/fluxolab:latest
```

Execução local:

```bash
docker run -p 3000:80 rubenslyra/fluxolab:0.2.0
```

## Git

- Tag local preparada: `v0.2.0`
- Base anterior conhecida: `v0.1.4`
