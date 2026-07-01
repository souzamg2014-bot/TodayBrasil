# Auditoria de conteúdo (anti-lixo)

Objetivo: manter o feed limpo de conteúdo que **não é notícia** (publieditorial, release patrocinado, promo/deal de e-commerce, filings da SEC). Regra em **fonte única**: `scripts/junk.mjs`.

## O que é considerado lixo
1. **Publieditorial / conteúdo de marca (por URL)**: caminhos como `/patrocinado/`, `/conteudo-de-marca/`, `/dino/` (Agência DINO), `pulse-brand`, `especial-publicitario`, `branded-content`. Ver `ADVERTORIAL_SEGMENTS`.
2. **Promo/deal e cupom (por título, alta precisão)**: `"90% OFF"`, `"Prime Day"`, `"Black Friday: ofertas"`, cupom/código promocional.
3. **Filings da SEC** (Form 4, DEF 14A, etc.).

## Defesa em duas camadas (auditar antes de subir)
1. **Na entrada (ingestão)**: `ingest-news.mjs` chama `isJunk(title, url)` e **descarta antes do upsert**. Nada de lixo é gravado.
2. **Rede de segurança (pipeline)**: `audit-content.mjs --purge` roda no workflow `ingest.yml` **depois da ingestão e antes do match de alertas**, limpando qualquer lixo que tenha escapado (`AUDIT_SINCE_MIN=120`, só o recente). Assim o conteúdo é auditado a cada ciclo antes de virar feed/alerta.

## Ferramenta de auditoria
```
node scripts/audit-content.mjs             # relatório do banco inteiro
node scripts/audit-content.mjs --purge     # relatório + apaga o lixo
AUDIT_SINCE_MIN=120 node scripts/audit-content.mjs --purge   # só o recente
```
Além do lixo (que é apagado), o relatório lista **SUSPEITOS por título** (reviews, listicles tipo "as 5 melhores opções") que **não são apagados** automaticamente, para revisão humana periódica. Se um padrão de suspeito se mostrar sempre lixo, promova-o para regra em `junk.mjs`.

## Como evoluir
- Novo padrão de publieditorial: adicionar o segmento em `ADVERTORIAL_SEGMENTS` (`junk.mjs`).
- Novo promo recorrente: adicionar regra de título de alta precisão em `isJunkTitle`.
- Rodar `node scripts/audit-content.mjs` de tempos em tempos e olhar a lista de suspeitos.
