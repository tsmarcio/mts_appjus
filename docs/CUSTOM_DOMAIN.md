# Dominio customizado

O GitHub Pages padrao mostra o usuario e repositorio:

```text
https://tsmarcio.github.io/mts_appjus/
```

Para ocultar GitHub no link publico, use um dominio proprio, por exemplo:

```text
app.mtsinforj.com.br
appjus.seudominio.com
```

Passos:

1. No provedor do dominio, crie um registro `CNAME` apontando para:

```text
tsmarcio.github.io
```

2. No GitHub, abra:

```text
Settings > Pages > Custom domain
```

3. Informe o dominio escolhido e salve.

4. Ative `Enforce HTTPS`.

5. Depois que o DNS estiver propagado, crie um arquivo `public/CNAME` com o dominio exato.

Exemplo:

```text
app.mtsinforj.com.br
```

Sem dominio proprio ou outra plataforma com login configurado, o GitHub Pages sempre exibira `github.io`.
