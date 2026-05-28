# Segurança

## Segredos e chaves

O FluxoLab não precisa de chave no modo IA local.

O painel de configurações permite inserir uma chave para uso local ou com gateways controlados pelo
usuário. Essa chave pode ficar somente na sessão atual ou no armazenamento local do navegador. Em
publicações abertas, prefira sempre um backend/proxy para guardar segredos, aplicar limites de uso e
auditar chamadas.

Nunca versionar:

- `.env`
- `.env.*`
- `*.key`
- `*.pem`
- `*.p12`
- `*.pfx`

## Cabeçalhos

A imagem Docker adiciona cabeçalhos básicos no Nginx:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- `Permissions-Policy` restritiva para câmera, microfone, geolocalização e pagamento
- CSP com `base-uri`, `object-src` e `frame-ancestors`

`script-src` ainda não está restrito porque o runtime SSR atual injeta scripts inline.
