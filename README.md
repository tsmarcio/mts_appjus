# MTS AppJus

Sistema web para juristas e profissionais do direito acompanharem operacoes de emprestimos informais com controle, conformidade, documentos, logs e historico de auditoria.

## Objetivo

O MTS AppJus nasce como uma base operacional segura para centralizar dossies juridicos, partes envolvidas, garantias, contratos, prazos, evidencias e trilhas de auditoria. A primeira entrega deste repositorio e a camada web visual, pronta para evoluir com backend, banco de dados, autenticacao e integracoes.

## Infraestrutura Atual

### Aplicacao

- Frontend SPA em React.
- Tipagem com TypeScript.
- Build e servidor local com Vite.
- Iconografia com Lucide React.
- Lint com Oxlint.
- Layout responsivo para desktop e mobile.
- Projeto versionado com Git.
- Remoto GitHub configurado em `origin`.

### Ferramentas Instaladas Na Maquina

- Node.js LTS: `v24.18.0`
- npm: `11.16.0`
- Git para Windows: instalado em `C:\Program Files\Git\cmd\git.exe`
- GitHub CLI: `2.96.0`, instalado em `C:\Program Files\GitHub CLI\gh.exe`
- Visual Studio Code: `1.129.1`
- Flutter SDK: `3.44.7`, instalado em `C:\Users\User\develop\flutter`
- Dart SDK: `3.12.2`, incluido no Flutter
- Android Studio: `2026.1.2.10`, instalado em `C:\Program Files\Android\Android Studio`
- Android SDK: `36.0.0`, instalado em `C:\Users\User\AppData\Local\Android\Sdk`
- Android Platform Tools / ADB: `37.0.0`
- .NET SDK: `8.0.423` e `9.0.316`
- Docker Desktop: `4.83.0`
- Docker CLI: `29.6.2`
- Supabase CLI: `2.109.1`, instalado globalmente e tambem como dependencia de desenvolvimento do projeto

Observacao: o Docker Desktop esta instalado e seus processos foram iniciados, mas a API do daemon pode precisar concluir a configuracao inicial do Docker Desktop ou reiniciar o Windows antes de responder a `docker info`.

### Variaveis E PATH Configurados

Foram configuradas variaveis de usuario:

```text
ANDROID_HOME=C:\Users\User\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\User\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
```

Entradas adicionadas ao PATH do usuario:

```text
C:\Users\User\develop\flutter\bin
C:\Program Files\Git\cmd
C:\Program Files\nodejs
C:\Program Files\GitHub CLI
C:\Program Files\Docker\Docker\resources\bin
C:\Program Files\dotnet
C:\Users\User\AppData\Roaming\npm
C:\Users\User\AppData\Local\Android\Sdk\cmdline-tools\latest\bin
C:\Users\User\AppData\Local\Android\Sdk\platform-tools
C:\Users\User\AppData\Local\Android\Sdk\emulator
C:\Program Files\Android\Android Studio\jbr\bin
```

Se o PowerShell bloquear comandos `.ps1`, use os wrappers `.cmd`:

```powershell
& "C:\Program Files\nodejs\npm.cmd" --version
& "C:\Users\User\AppData\Roaming\npm\supabase.cmd" --version
```

### Extensoes Do VS Code Instaladas

- `dart-code.dart-code`
- `dart-code.flutter`
- `ms-dotnettools.csharp`
- `ms-dotnettools.csdevkit`
- `ms-azuretools.vscode-docker`
- `ms-azuretools.vscode-containers`
- `github.vscode-github-actions`
- Extensoes PostgreSQL/SQLTools ja existentes no ambiente

### Flutter Doctor

Resultado apos instalacao:

```text
[√] Flutter
[√] Windows Version
[√] Android toolchain
[√] Chrome
[√] Connected device
[√] Network resources
```

Aviso restante:

```text
[!] Visual Studio - develop Windows apps
```

Esse aviso e apenas para compilar aplicativos Flutter Windows desktop. Para Flutter Web e Android, a toolchain ficou pronta.

### Repositorio GitHub

Remote atual:

```text
origin  repositorio GitHub do projeto
```

Branch local:

```text
main
```

## Funcionalidades Visuais Ja Criadas

- Dashboard com indicadores de carteira, operacoes ativas, alertas juridicos e indice de compliance.
- Navegacao lateral para Dashboard, Dossies, Partes, Auditoria e Compliance.
- Lista de dossies prioritarios com fase, valor, risco e prazo.
- Formulario inicial de nova operacao.
- Matriz de conformidade por etapa.
- Historico de auditoria com eventos rastreaveis.
- Painel de seguranca com cadeia de custodia, logs e rastreio.
- Area preparada para roadmap tecnico e integracoes futuras.
- Secao de esboco visual com o Figma Starter Kit importado para visualizacao local.
- Layout clean focado em contratos: quantidade total, ativos, inadimplentes, dossies e cadastro para juristas.

## Estrutura Do Projeto

```text
mts_appjus/
  public/
    favicon.svg
    icons.svg
    figma-starter-kit/
      01_Arquitetura_Informacao.svg
      02_Fluxos_Principais.svg
      03_Design_System.svg
      04_Inventario_Telas.svg
      05_Wireframes_Iniciais.svg
  src/
    App.tsx
    App.css
    index.css
    main.tsx
    assets/
  docs/
    figma-starter-kit/
      LEIA-ME_IMPORTAR_NO_FIGMA.txt
      01_Arquitetura_Informacao.svg
      02_Fluxos_Principais.svg
      03_Design_System.svg
      04_Inventario_Telas.svg
      05_Wireframes_Iniciais.svg
  index.html
  package.json
  package-lock.json
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  vite.config.ts
  README.md
```

## Stack Tecnica

| Camada | Tecnologia |
| --- | --- |
| Interface | React |
| Linguagem | TypeScript |
| Bundler/dev server | Vite |
| Icones | Lucide React |
| Lint | Oxlint |
| Versionamento | Git |
| Publicacao de codigo | GitHub |

## Como Rodar Localmente

No terminal dentro da pasta do projeto:

```bash
npm install
npm run dev
```

URL local padrao:

```text
http://127.0.0.1:5173
```

Esboco visual no app:

```text
http://127.0.0.1:5173/#figma
```

Arquivos SVG servidos diretamente:

```text
http://127.0.0.1:5173/figma-starter-kit/01_Arquitetura_Informacao.svg
http://127.0.0.1:5173/figma-starter-kit/02_Fluxos_Principais.svg
http://127.0.0.1:5173/figma-starter-kit/03_Design_System.svg
http://127.0.0.1:5173/figma-starter-kit/04_Inventario_Telas.svg
http://127.0.0.1:5173/figma-starter-kit/05_Wireframes_Iniciais.svg
```

Se o PowerShell ainda nao reconhecer `npm`, use o caminho completo:

```powershell
$env:PATH = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:PATH
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
```

## Supabase Local

O projeto ja possui estrutura Supabase em:

```text
supabase/
  config.toml
  migrations/
    20260721003000_initial_appjus_schema.sql
  seed.sql
```

A migration cria a base inicial:

- `clients`
- `operations`
- `documents`
- `compliance_checks`
- `audit_logs`

Para iniciar o Supabase local:

```powershell
$env:PATH = "C:\Program Files\nodejs;C:\Users\User\AppData\Roaming\npm;C:\Program Files\Docker\Docker\resources\bin;" + $env:PATH
& "C:\Users\User\AppData\Roaming\npm\supabase.cmd" start
```

Depois que o comando terminar, copie `API URL` e `anon key` para `.env.local`:

```text
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

O app ja possui cliente Supabase em:

```text
src/lib/supabase.ts
```

## Camada SaaS Multiusuario

O sistema foi preparado para uso por multiplos usuarios/clientes no mesmo link web.

Modelo adotado:

- Cada usuario faz login pelo Supabase Auth.
- Cada usuario pertence a uma empresa/base, chamada `tenant`.
- Clientes e contratos ficam vinculados a `tenant_id`.
- Row Level Security separa os dados: um usuario so enxerga a propria base.
- A tabela `subscriptions` guarda o status da mensalidade por tenant.

Tabelas principais da camada SaaS:

```text
tenants
tenant_members
subscriptions
clients
operations
documents
compliance_checks
audit_logs
```

Status de assinatura previstos:

```text
trialing
active
past_due
canceled
```

Importante: a cobranca mensal nao deve ser feita no frontend. Para Stripe, Mercado Pago ou outro provedor, crie checkout e webhooks em Supabase Edge Functions ou backend separado, usando chaves secretas fora do codigo publico.

Para ativar login no site publicado, configure estas variaveis no build:

```text
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_publica
```

Sem essas variaveis, o app continua em modo local/demo e salva dados apenas no navegador.

## Publicacao Online

O link publico recomendado para este sistema e Cloudflare Workers.

Link desejado depois de alterar o subdominio `workers.dev` da conta Cloudflare para `mtsappjus`:

```text
https://mtsappjus.mtsappjus.workers.dev
```

Configuracao atual do Worker:

```text
Worker: mtsappjus
Build command: npm run build
Deploy command: npx wrangler deploy
```

O workflow `.github/workflows/cloudflare-worker.yml` publica automaticamente a branch `main` no Cloudflare Worker quando os secrets estiverem configurados:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Para dominio proprio ou rotas customizadas:

```text
docs/CLOUDFLARE_WORKERS.md
docs/CUSTOM_DOMAIN.md
```

Para o site publicado usar Supabase online, cadastre os secrets:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Docker

O frontend tambem pode rodar em container com:

```powershell
$env:PATH = "C:\Program Files\Docker\Docker\resources\bin;" + $env:PATH
docker compose up --build
```

URL do frontend em Docker:

```text
http://127.0.0.1:8080
```

Arquivos Docker:

```text
Dockerfile
compose.yaml
.dockerignore
```

Observacao: Supabase local tambem usa Docker por baixo. Se `docker info` ou `supabase start` travar/falhar, abra o Docker Desktop, finalize a configuracao inicial e confirme que o WSL esta instalado.

## Mudanca De Layout

Guia rapido:

```text
docs/LAYOUT_GUIDE.md
```

Pontos principais:

- Cores e tokens: topo de `src/App.css`.
- Estrutura das telas: `src/App.tsx`.
- Esbocos importados do Figma: `docs/figma-starter-kit`.
- Previews no navegador: `http://127.0.0.1:5173/#figma`.

## Scripts Disponiveis

```bash
npm run dev
```

Sobe o servidor local de desenvolvimento.

```bash
npm run lint
```

Executa validacao estatica com Oxlint.

```bash
npm run build
```

Gera a versao de producao em `dist/`.

```bash
npm run preview
```

Serve localmente a versao gerada pelo build.

## Validacao Da Base

Comandos ja executados com sucesso:

```bash
npm run lint
npm run build
```

Resultado do build:

```text
dist/index.html
dist/assets/*.css
dist/assets/*.js
```

## Fluxo Git E GitHub

Status atual do projeto:

```text
main...origin/main
```

Para publicar no GitHub:

```bash
git push -u origin main
```

Se o terminal nao reconhecer `git`, use:

```powershell
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
& "C:\Program Files\Git\cmd\git.exe" push -u origin main
```

Se ainda nao estiver autenticado no GitHub:

```powershell
$env:PATH = "C:\Program Files\GitHub CLI;" + $env:PATH
& "C:\Program Files\GitHub CLI\gh.exe" auth login
```

Depois da autenticacao:

```powershell
& "C:\Program Files\Git\cmd\git.exe" push -u origin main
```

## Infraestrutura Planejada Para Proxima Etapa

### Backend

Recomendacao inicial:

- API Node.js com Fastify ou NestJS.
- Validacao de dados com Zod.
- Camada de servicos para dossies, partes, documentos, operacoes e auditoria.
- Endpoints REST ou GraphQL conforme necessidade de integracao.

### Banco De Dados

Recomendacao inicial:

- PostgreSQL para dados relacionais.
- Prisma ORM para migrations e acesso tipado.
- Tabelas principais: `users`, `clients`, `operations`, `documents`, `audit_logs`, `compliance_checks`, `deadlines`.

### Autenticacao E Permissoes

Recomendacao inicial:

- Login por email/senha ou provedor externo.
- Controle de acesso por perfil: administrador, advogado, operador, auditor e visualizador.
- Sessao segura com tokens HTTP-only.
- Registro de acoes sensiveis em `audit_logs`.

### Documentos

Recomendacao inicial:

- Upload seguro de contratos, comprovantes e anexos.
- Hash dos arquivos para cadeia de custodia.
- Versionamento de documentos.
- Permissoes por dossie.

### Compliance E Auditoria

Recomendacao inicial:

- Checklist LGPD.
- Checklist de origem de recursos.
- Registro de aceite, assinatura e revisao.
- Timeline imutavel de eventos importantes.

### Deploy

Opcoes recomendadas:

- Frontend: Cloudflare Workers.
- Backend: Render, Railway, Fly.io, AWS ou Azure.
- Banco: Supabase, Neon, Railway PostgreSQL ou RDS.
- CI/CD: GitHub Actions.

## Variaveis De Ambiente Futuras

Quando houver backend e integracoes, criar um arquivo `.env.example` com chaves como:

```text
VITE_API_URL=
DATABASE_URL=
JWT_SECRET=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

## Proximos Passos Sugeridos

1. Autenticar GitHub CLI com `gh auth login`.
2. Fazer push da branch `main`.
3. Definir backend e banco de dados.
4. Criar modelagem inicial de dossies, partes e logs.
5. Conectar a interface visual a dados reais.
6. Configurar deploy e CI/CD.
