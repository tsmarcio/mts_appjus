# Supabase no Cloudflare

O site so sai do modo local quando o Worker recebe estas variaveis em producao:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Tambem sao aceitos estes aliases:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

## Onde pegar no Supabase

No painel Supabase:

```text
Project Settings > API
```

Use:

```text
Project URL -> VITE_SUPABASE_URL
anon public key -> VITE_SUPABASE_ANON_KEY
```

## Onde colocar no Cloudflare

No painel Cloudflare:

```text
Workers & Pages > mtsappjus > Settings > Variables
```

Adicione as variaveis em `Production`.

Depois va em:

```text
Workers & Pages > mtsappjus > Deployments
```

Clique em `Retry deployment` ou faca novo deploy pela branch `main`.

## Como validar

Abra o link:

```text
https://mtsappjus.mtsappjus.workers.dev
```

Se aparecer `Banco Supabase pendente`, as variaveis ainda nao chegaram ao Worker.

Se aparecer a tela de login, o Supabase esta conectado.
