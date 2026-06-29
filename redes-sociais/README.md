# Redes Sociais — fonte de conteúdo (LinkedIn + Instagram)

Esta pasta é alimentada pelo pipeline dos **Resumos Inteligentes**. Cada resumo gerado também
produz, aqui, o texto pronto para postar (post único, sem carrossel: título + legenda por rede).
O usuário monta a arte padrão por fora; o texto é o entregável.

## Organização

```
redes-sociais/
  {tema}/
    {YYYY-MM-DD}/
      manha.md     (18h–7h)
      tarde.md     (7h–13h)
      noite.md     (13h–18h)
```

- **temas**: `ma` (M&A), `startup`, `inovacao`, `industria`, `politica`.
- **janelas**: `manha`, `tarde`, `noite`.

## Formato de cada arquivo

```markdown
---
tema: ma
janela: tarde
data: 2026-06-28
n_fontes: 5
---

# <título do resumo>

## LinkedIn
**<título>**

<legenda executiva, 1–3 parágrafos, "Fontes: ...">

## Instagram
**<título da arte>**

<legenda enxuta + hashtags>

## Fontes
- [veículo](url)
```

## Como gerar

1. `node scripts/resumos-brief.mjs` (use `JANELA=manha|tarde|noite`) → cria `resumos-brief.md`.
2. O Claude lê o briefing e escreve `resumos.json` (ver `docs/resumos-prompt.md`).
3. `node scripts/resumos-insert.mjs resumos.json` → sobe os resumos pro site **e** grava os
   arquivos `.md` aqui.
4. `node scripts/build-posts-html.mjs` → atualiza o app de arte `posts-prontos.html` com os
   novos posts (lê o mesmo `resumos.json`).

## App de arte — `posts-prontos.html`

Abra o arquivo no navegador (duplo clique). É o gerador de imagens dos posts (1080x1080):

- **Navega** post a post (setas ‹ ›, teclado ← →, ou o seletor).
- **Título** editável; a parte entre `[colchetes]` sai pintada com a **cor de destaque**.
- **Imagem**: arraste/solte o arquivo, depois **arraste na arte para reposicionar** e use o
  **slider** ou a **roda do mouse** (sobre a arte) para **zoom**. Botão *Resetar* recentraliza.
- **Legendas** LinkedIn e Instagram são **editáveis** e têm botão *Copiar*.
- **Baixar PNG** exporta a arte pronta.

Todos os ajustes (imagem, zoom, posição, cor, título e textos editados) são salvos
automaticamente no `localStorage` do navegador, por post. Rodar o `build-posts-html.mjs` de
novo só troca a lista de posts; os ajustes já feitos continuam guardados pelo id do post.

### Campo opcional no `resumos.json`

- `arte_titulo`: título curto da arte, com a parte de destaque entre `[colchetes]`
  (ex.: `"[Volkswagen] estuda cortar 100 mil empregos"`). Se ausente, o gerador usa o título
  do Instagram.

> O conteúdo gerado é privado (ignorado pelo git). Só este README é versionado.
