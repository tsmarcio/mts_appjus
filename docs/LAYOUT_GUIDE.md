# Guia rapido para mudar o layout

O layout principal fica em:

```text
src/App.tsx
src/App.css
src/index.css
```

## Cores

As cores principais estao no topo de `src/App.css`, dentro de `:root`:

```css
--gold: #d3ad4f;
--gold-soft: #f8edcf;
--ink: #f7f2e7;
--muted: #a9c1d4;
--line: rgba(211, 173, 79, 0.28);
--panel: rgba(20, 36, 45, 0.78);
```

Para mudar a identidade visual, comece por esses tokens. O restante da tela reaproveita essas variaveis.

## Estrutura

- Menu lateral: bloco `<aside className="sidebar">` em `src/App.tsx`.
- Topo e busca: `<header className="topbar">`.
- Indicadores: array `metrics`.
- Abas de contrato: `contractTab` e lista `contractStatusLabels`.
- Lista de contratos: painel `contracts-panel`.
- Cadastro de novo acordo: formulario no painel `entry-panel`.
- Login, Pix e liberacao de acesso: blocos `auth-shell`, `payment-box` e `admin-panel`.
- Rodape: bloco `site-footer`.

## Caminhos de melhoria visual

1. Para um visual mais juridico premium: manter fundo escuro, dourado pontual, poucas bordas e textos bem alinhados.
2. Para um visual SaaS operacional: aumentar densidade, reduzir altura de cards e mostrar mais linhas por tela.
3. Para mobile-first: testar primeiro com largura de 390px e evitar textos longos em botoes.
4. Para refinar o banner: ajustar `.brand-hero` e `.brand-hero img`, mantendo `object-fit: contain`.

## Regra pratica

Se voce quiser mudar uma tela inteira, mexa primeiro no JSX em `src/App.tsx`.
Se voce quiser mudar aparencia, cores, tamanhos e espacos, mexa primeiro em `src/App.css`.
