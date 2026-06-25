# newsfeed

Feed publico de noticias. Compila o que acontece na web e deixa filtrar por
setor, palavra-chave e (fase 2) contexto. Acesso gratis, sem login.

## Stack

- **Next.js + Supabase + Vercel** (front le com a chave anonima)
- **Robo de ingestao** em Node: varre RSS de varios portais, classifica em
  18 setores e grava em `news_articles` (custo zero de token)
- Busca **full-text do Postgres** (PT) no v1; semantica (pgvector) na fase 2

## Setup

1. Crie o projeto no Supabase e rode `supabase/schema.sql` no SQL Editor.
2. Copie `.env.local.example` para `.env.local` e preencha as chaves.
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`: vao pro front.
   - `SUPABASE_SERVICE_ROLE_KEY`: so no robo, nunca no front.
3. `npm install`
4. `npm run ingest` para encher o banco.
5. `npm run dev` para o front.

## Roadmap

- **Fase 1 (agora):** ingestao PT-BR, schema, feed publico no ar, cron de ingestao.
- **Fase 2:** busca semantica (pgvector), fontes EN/ES, contas e personalizacao.
- **Fase 3:** app (PWA ou Expo).
