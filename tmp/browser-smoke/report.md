# Browser smoke report

- Base URL: http://127.0.0.1:8088
- App URL: http://127.0.0.1:8088/fluxolab/
- Status: passed
- Chrome stderr:
  DevTools listening on ws://127.0.0.1:9222/devtools/browser/566001e6-7d04-478e-b9fb-5a5972f40ac5
  [24692:23532:0529/161204.635:ERROR:chrome\browser\ui\webui\ntp\new_tab_ui.cc:54] Requested load of chrome://newtab/ for incorrect profile type.
- Screenshots:
  - tmp/browser-smoke/screenshots/01-home-splash.png
  - tmp/browser-smoke/screenshots/02-post-enter.png
  - tmp/browser-smoke/screenshots/03-home-editor.png
  - tmp/browser-smoke/screenshots/04-desafios.png
  - tmp/browser-smoke/screenshots/05-editor.png
  - tmp/browser-smoke/screenshots/06-settings-open.png
  - tmp/browser-smoke/screenshots/07-settings-after-save.png
  - tmp/browser-smoke/screenshots/08-privacidade.png
  - tmp/browser-smoke/screenshots/09-uso.png
  - tmp/browser-smoke/screenshots/10-cookies.png
  - tmp/browser-smoke/screenshots/11-final-editor.png
- Video: tmp/browser-smoke/session.mp4

## Checks
- Splash carregada no primeiro acesso.
- Splash dispensada e editor exibido.
- Alternância para o modo de desafios.
- Retorno ao modo editor.
- Painel de configurações aberto.
- Alterações locais aplicadas no painel.
- Rota de privacidade acessada.
- Rota de uso acessada.
- Rota de cookies acessada.
- Retorno final ao editor sem a splash na mesma sessão.

