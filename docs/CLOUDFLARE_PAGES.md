# Cloudflare Pages

Link desejado:

```text
https://mts-appjus.pages.dev
```

O deploy no Cloudflare Pages exige uma conta Cloudflare e token de API.

## Secrets no GitHub

Em `Settings > Secrets and variables > Actions`, adicione:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

O token precisa ter permissao para Cloudflare Pages.

## Deploy

Depois dos secrets:

1. Abra `Actions`.
2. Rode `Deploy Cloudflare Pages`.
3. O projeto sera publicado como:

```text
https://mts-appjus.pages.dev
```

Tambem sera publicado automaticamente a cada push na branch `main`.

## Correcao do painel Cloudflare

Se o log mostrar:

```text
Executing user deploy command: npx wrangler deploy
Uploaded appjus
https://appjus.tsmarcio.workers.dev
```

voce criou/publicou como Workers, nao como Pages.

Para gerar exatamente:

```text
https://mts-appjus.pages.dev
```

use estas configuracoes no Cloudflare Pages:

```text
Project name: mts-appjus
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Deploy command: deixe vazio
```

Nao use:

```text
npx wrangler deploy
```

Se quiser deploy manual pelo terminal, use:

```bash
npm run deploy:cloudflare
```
