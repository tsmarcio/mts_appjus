# Guia rapido para mudar o layout

O layout principal fica em:

```text
src/App.tsx
src/App.css
src/index.css
```

## Cores

As cores principais estao no topo de `src/App.css`, dentro de `.app-shell`:

```css
--brand-900: #123a24;
--brand-700: #1f6a3e;
--brand-500: #31a85b;
--brand-100: #e1f7e8;
--ink-950: #0d1117;
--page: #f8f9fa;
```

Para mudar a identidade visual, comece por esses tokens. O restante da tela reaproveita essas variaveis.

## Estrutura

- Menu lateral: bloco `<aside className="sidebar">` em `src/App.tsx`.
- Topo e busca: `<header className="topbar">`.
- Indicadores: array `metrics`.
- Tabela de operacoes: array `operations`.
- Compliance: array `workflow`.
- Auditoria: array `auditTrail`.
- Esboco Figma: array `figmaBoards`.

## Caminhos de melhoria visual

1. Para um visual mais juridico premium: manter verde escuro, mais branco, menos sombras.
2. Para um visual SaaS operacional: aumentar densidade, reduzir cards e mostrar mais linhas por tela.
3. Para um visual mobile-first: transformar a sidebar em barra inferior e priorizar cards empilhados.
4. Para seguir o Figma: use os SVGs em `docs/figma-starter-kit` como referencia de frames.

## Regra pratica

Se voce quiser mudar uma tela inteira, mexa primeiro no JSX em `src/App.tsx`.
Se voce quiser mudar aparencia, cores, tamanhos e espacos, mexa primeiro em `src/App.css`.
