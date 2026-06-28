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

> O conteúdo gerado é privado (ignorado pelo git). Só este README é versionado.
