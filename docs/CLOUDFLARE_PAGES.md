# Cloudflare Workers / Pages

## Link atual por Workers

```text
https://mtsappjus.tsmarcio.workers.dev
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

Por isso o trecho `tsmarcio` nao vem do codigo. Ele e o subdominio da conta Cloudflare. Para tirar esse nome do link gratis, altere o subdominio `workers.dev` da conta no painel Cloudflare, se a conta permitir. Exemplo:

```text
https://mtsappjus.mtsappjus.workers.dev
```

Para um link totalmente profissional/oculto, a melhor opcao e usar dominio proprio no Cloudflare.

## Secrets no GitHub

Em `Settings > Secrets and variables > Actions`, adicione:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

O token precisa ter permissao para Cloudflare Workers ou Pages, conforme a forma escolhida.

## Deploy por Workers

Depois que o projeto estiver conectado no Cloudflare:

```text
Framework preset: Vite
Build command: npm run build
Deploy command: npx wrangler deploy
```

O link esperado, mantendo o subdominio atual da conta, sera:

```text
https://mtsappjus.tsmarcio.workers.dev
```

## Alternativa por Pages

Se quiser gerar exatamente:

```text
https://mts-appjus.pages.dev
```

crie um projeto em Cloudflare Pages, nao Workers, com:

```text
Project name: mts-appjus
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Deploy command: deixe vazio
```

No terminal, o deploy manual por Pages continua disponivel:

```bash
npm run deploy:cloudflare-pages
```

## Como identificar a configuracao errada

Se o log mostrar:

```text
Executing user deploy command: npx wrangler deploy
Uploaded appjus
https://appjus.tsmarcio.workers.dev
```

voce criou/publicou como Workers, nao como Pages.
