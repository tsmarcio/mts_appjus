# Cloudflare Workers

## Link desejado por Workers

```text
https://mtsappjus.mtsappjus.workers.dev
```

O projeto esta configurado para publicar como Cloudflare Worker pelo comando:

```bash
npm run deploy:cloudflare
```

O `wrangler.toml` usa:

```toml
name = "mtsappjus"
main = "dist/server/index.js"
workers_dev = true
```

Isso troca o Worker antigo `appjus` para `mtsappjus`, que e o servico aberto no painel Cloudflare.

Importante: em links gratuitos de Workers, o formato sempre e:

```text
https://nome-do-worker.subdominio-da-conta.workers.dev
```

Por isso o segundo trecho do link nao vem do codigo. Ele e o subdominio `workers.dev` da conta Cloudflare. Para deixar tudo como `mtsappjus`, altere o subdominio `workers.dev` da conta no painel Cloudflare para `mtsappjus`.

```text
https://mtsappjus.mtsappjus.workers.dev
```

Para um link totalmente profissional/oculto, a melhor opcao e usar dominio proprio no Cloudflare.

## Onde alterar no Cloudflare

No painel Cloudflare:

```text
Workers & Pages > Overview
```

No bloco lateral de subdominio `workers.dev`, clique em `Change` ou `Alterar` e informe:

```text
mtsappjus
```

Depois disso, o link gratis esperado fica:

```text
https://mtsappjus.mtsappjus.workers.dev
```

## Secrets no GitHub

Em `Settings > Secrets and variables > Actions`, adicione:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

O token precisa ter permissao para Cloudflare Workers.

## Deploy por Workers

Depois que o projeto estiver conectado no Cloudflare:

```text
Framework preset: Vite
Build command: npm run build
Deploy command: npx wrangler deploy
```

O link esperado, apos mudar o subdominio da conta para `mtsappjus`, sera:

```text
https://mtsappjus.mtsappjus.workers.dev
```

## Como identificar a configuracao errada

Se o log mostrar um Worker antigo ou outro subdominio de conta:

```text
Executing user deploy command: npx wrangler deploy
Uploaded appjus
https://appjus.<subdominio-da-conta>.workers.dev
```

o nome do Worker ou o subdominio da conta ainda nao estao alinhados.
