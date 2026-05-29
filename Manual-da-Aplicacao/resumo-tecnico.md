# Resumo Tecnico

## Etapa atual

Esta etapa adicionou uma splashscreen com carregamento e politicas acessiveis por rotas, alem do diretório de documentação em raiz.

## Arquivos principais alterados

- [src/routes/index.tsx](../src/routes/index.tsx)
- [src/components/system/SplashScreen.tsx](../src/components/system/SplashScreen.tsx)
- [src/routes/privacidade.tsx](../src/routes/privacidade.tsx)
- [src/routes/uso.tsx](../src/routes/uso.tsx)
- [src/routes/cookies.tsx](../src/routes/cookies.tsx)

## Comportamento

- A splashscreen aparece no primeiro acesso da sessão do navegador.
- O usuario pode entrar no editor manualmente apos o carregamento.
- As politicas ficam separadas em rotas dedicadas.
- A documentacao textual fica em `Manual-da-Aplicacao/`.

## Persistencia local

- `fluxolab-splash-ack-v1`: registra que a tela inicial foi aceita.
- Preferencias de tema, exportacao e edicao continuam sendo tratadas pelos modulos ja existentes.

## Resumo de impacto

- Nenhum fluxo funcional foi removido.
- O editor continua sendo a tela principal depois da splash.
- As politicas nao interferem na logica de desenho.
