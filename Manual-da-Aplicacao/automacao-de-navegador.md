# Automacao de Navegador

## Objetivo

O projeto inclui um smoke test de navegador para validar o fluxo principal do FluxoLab no ambiente local e no container.

## Comando

```bash
bun run browser:smoke
```

## Cobertura

- abre a splash inicial
- entra no editor principal
- alterna entre editor e desafios
- abre o painel de configuracoes
- percorre as rotas de privacidade, uso e cookies
- registra capturas de tela e um video da sessao

## Artefatos

Os arquivos ficam em `tmp/browser-smoke/`:

- `report.md`: resumo da execucao
- `screenshots/`: capturas dos passos
- `session.mp4`: video da sequencia validada

## Observacao

O smoke foi preparado para o Chrome local com DevTools remoto. Se o ambiente usar outro binario, ajuste `BROWSER_SMOKE_CHROME_PATH` antes de rodar o comando.
