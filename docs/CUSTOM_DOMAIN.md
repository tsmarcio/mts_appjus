# Dominio customizado

O link publico recomendado para este projeto e Cloudflare Workers.

Link gratis desejado:

```text
https://mtsappjus.mtsappjus.workers.dev
```

Para ocultar completamente a plataforma no link publico, use um dominio proprio, por exemplo:

```text
app.mtsinforj.com.br
appjus.seudominio.com
```

## Cloudflare Workers

No Cloudflare, abra:

```text
Workers & Pages > mtsappjus > Settings > Domains & Routes
```

Depois selecione `Add Custom Domain` e informe o dominio escolhido.

## GitHub Pages

GitHub Pages tambem funciona, mas o link gratuito mostra `github.io`. Para esconder isso, precisa de dominio proprio configurado em:

```text
Settings > Pages > Custom domain
```

Depois que o DNS estiver propagado, crie um arquivo `public/CNAME` com o dominio exato.

Exemplo:

```text
app.mtsinforj.com.br
```

Sem dominio proprio, o GitHub Pages sempre exibira `github.io`.
