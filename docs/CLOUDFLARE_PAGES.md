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
