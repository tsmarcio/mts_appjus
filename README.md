# MTS AppJus

Base operacional web para controle de acordos privados, clientes, contratos, valores, datas reais e documentos vinculados.

Link oficial em producao:

```text
https://mtsappjus.mtsappjus.workers.dev
```

## Estado Atual

- Interface web em React, TypeScript e Vite.
- Layout clean, responsivo para desktop e celular.
- Login por Supabase Auth.
- Banco Supabase online com separacao por usuario/base.
- Multiusuario com `tenant_id` e Row Level Security.
- Compra unica por Pix no valor de R$ 29,99.
- QR Code Pix e copia-e-cola dentro da tela de login.
- Cadastro inicial sem disparo de e-mail do Supabase, para evitar limite do SMTP padrao.
- Login bloqueado ate liberacao manual do proprietario.
- Painel do proprietario para liberar acessos Pix.
- Cadastro de contratos sem campo extra duplicado: o nome do cliente pode receber apelido junto ao nome.
- Porcentagem a receber por contrato, de 10% a 100%.
- Valor total a receber em 30 dias calculado automaticamente.
- Abas de contratos por status: todos, ativos, pausados, inadimplentes e mensal.
- Filtros de contratos por dia, mes e ano, com resumo de valores filtrados.
- Alteracao rapida de status direto na linha do contrato.
- Opcao sem porcentagem para contratos sem acrescimo em 30 dias.
- Lembrete de divida via WhatsApp quando houver telefone cadastrado.
- Calculadora rapida na barra lateral.
- Deploy em Cloudflare Workers.
- Codigo versionado na branch `main` do GitHub.

## Contato E Rodape

Informacoes exibidas no sistema:

```text
Feito por: mtsinforj
Instagram: @mtsinforj
Telefone/WhatsApp: 21964976686
E-mail: mts.ic@hotmail.com
```

## Fluxo De Compra E Liberacao

1. O usuario acessa o sistema online.
2. Na tela de login, ele paga Pix unico de R$ 29,99.
3. Chave Pix telefone:

```text
21964976686
```

4. O usuario envia o comprovante pelo WhatsApp.
5. O usuario cria a conta no sistema.
6. A conta nasce com status `pending_payment`.
7. O proprietario entra com o e-mail administrador:

```text
mts.ic@hotmail.com
```

8. No menu `Liberar acessos`, o proprietario clica em `Liberar login`.
9. A assinatura muda para `active` e o usuario passa a acessar sua propria base.

## Arquivos Pix E Treinamento

QR Code Pix:

```text
public/payments/pix-mtsappjus.svg
```

Pix copia-e-cola:

```text
public/payments/pix-copia-e-cola.txt
```

Treinamento para enviar por WhatsApp:

```text
docs/TREINAMENTO_USUARIO_WHATSAPP.md
public/docs/treinamento-usuario-whatsapp.txt
```

No site publicado, o arquivo TXT fica em:

```text
https://mtsappjus.mtsappjus.workers.dev/docs/treinamento-usuario-whatsapp.txt
```

## Estrutura Do Projeto

```text
mts_appjus/
  .github/workflows/
  .openai/
  docs/
    CLOUDFLARE_WORKERS.md
    CUSTOM_DOMAIN.md
    LAYOUT_GUIDE.md
    SUPABASE_CLOUDFLARE_SETUP.md
    TREINAMENTO_USUARIO_WHATSAPP.md
  public/
    brand/
    docs/
    payments/
    favicon.svg
    icons.svg
  scripts/
    prepare-sites-build.mjs
  src/
    App.css
    App.tsx
    index.css
    lib/supabase.ts
    main.tsx
  supabase/
    migrations/
    seed.sql
  Dockerfile
  compose.yaml
  package.json
  wrangler.toml
```

## Rodar Localmente

No PowerShell dentro da pasta do projeto:

```powershell
$env:PATH = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;" + $env:PATH
npm install
npm run dev
```

URL local padrao:

```text
http://127.0.0.1:5173
```

Quando o Supabase online estiver configurado no Cloudflare, o site publicado usa o banco online. Localmente, crie `.env.local` se quiser testar com Supabase:

```text
VITE_SUPABASE_URL=https://rbcwctqldmohltkaelcq.supabase.co
VITE_SUPABASE_ANON_KEY=sua_publishable_key
```

## Banco Supabase

Projeto Supabase:

```text
rbcwctqldmohltkaelcq
https://rbcwctqldmohltkaelcq.supabase.co
```

Tabelas principais:

```text
tenants
tenant_members
subscriptions
clients
operations
documents
audit_logs
```

Tabelas internas:

```text
private.app_admins
```

Status de assinatura:

```text
pending_payment
trialing
active
past_due
canceled
```

Regras importantes:

- Cada usuario acessa somente os dados da propria base.
- `tenant_members` vincula usuario e base.
- `clients` e `operations` usam `tenant_id`.
- O proprietario cadastrado em `private.app_admins` consegue listar e liberar assinaturas.
- A chave `service_role` ou secret key nunca deve ir para o frontend.
- O banco mantem somente os campos atuais de contrato. A coluna antiga `requested_by` e removida pela migration `20260722043709_remove_requested_by_column.sql`.
- O cadastro usa a RPC `public.register_app_user` para criar o usuario confirmado e a assinatura `pending_payment` sem chamar `/auth/v1/signup`.
- Essa RPC evita o erro `email rate limit exceeded` do SMTP padrao do Supabase.

## Dados De Teste

O arquivo `supabase/seed.sql` cria 10 contratos de exemplo para o usuario master:

```text
mts.ic@hotmail.com
```

Os exemplos usam codigos `MTS-TEST-001` ate `MTS-TEST-010`, com clientes, documentos, telefones, e-mails, valores, status, datas, prazos e porcentagens preenchidos.

Para aplicar no banco remoto pelo CLI, primeiro linke o projeto Supabase e depois rode:

```powershell
npx supabase db query --linked --file supabase/seed.sql
```

Quando terminar os testes, a base pode ser limpa removendo os codigos `MTS-TEST-001` ate `MTS-TEST-010`.

## Limite De E-mail Do Supabase

O Supabase Free permite muitos usuarios ativos mensais, mas o SMTP padrao do Auth e limitado para producao. O endpoint de cadastro padrao `/auth/v1/signup` pode bater em `email rate limit exceeded`.

Neste projeto, o cadastro do app foi ajustado para nao enviar e-mail na criacao da conta. O usuario cria a conta, entra com senha e fica bloqueado ate a liberacao Pix.

Para producao completa, configure SMTP proprio no Supabase para recursos como recuperacao de senha, notificacoes e confirmacoes futuras:

```text
Supabase > Authentication > Emails > SMTP Settings
```

## Cloudflare Workers

Worker em producao:

```text
mtsappjus
https://mtsappjus.mtsappjus.workers.dev
```

Variaveis/secrets necessarios no Cloudflare:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
```

O Worker injeta essas variaveis no navegador em runtime. O arquivo `scripts/prepare-sites-build.mjs` gera o servidor final em `dist/server/index.js` e tambem entrega QR Code, Pix copia-e-cola, treinamento, logo, favicon e icones.

Deploy manual:

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run build
npx wrangler deploy
```

## GitHub

Branch principal:

```text
main
```

Publicar codigo:

```powershell
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
git status
git add .
git commit -m "Mensagem do ajuste"
git push origin main
```

O link antigo do GitHub Pages foi removido. O sistema publicado deve ser acessado pelo Cloudflare Workers.

## Docker

Rodar frontend em container:

```powershell
docker compose up --build
```

URL em Docker:

```text
http://127.0.0.1:8080
```

Observacao: Supabase local tambem depende do Docker Desktop.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run preview
npm run deploy:cloudflare
```

## Validacao

Antes de publicar, rode:

```powershell
npm run lint
npm run build
```

Depois do deploy, validar:

```text
https://mtsappjus.mtsappjus.workers.dev
https://mtsappjus.mtsappjus.workers.dev/payments/pix-mtsappjus.svg
https://mtsappjus.mtsappjus.workers.dev/docs/treinamento-usuario-whatsapp.txt
```

## Futuro Android

A base atual e web responsiva. Para Android, a evolucao recomendada e criar um app Flutter usando o mesmo Supabase, os mesmos conceitos de login, tenant, assinatura e contratos. A regra principal e manter toda permissao sensivel no Supabase/RLS ou em backend seguro, nunca somente no app.
