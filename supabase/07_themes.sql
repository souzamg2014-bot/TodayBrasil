-- ============================================================
-- newsfeed - LENTES (temas que cruzam setores): coluna + indice
-- Rode no SQL Editor do Supabase (uma vez).
--
-- Depois rode o backfill p/ marcar o que ja existe:
--   npm run backfill:themes
-- O robo (npm run ingest) ja passa a gravar themes em cada noticia nova.
-- ============================================================

alter table public.news_articles
  add column if not exists themes text[] not null default '{}';

-- filtro por lente: overlap de arrays (operador &&) usa GIN.
create index if not exists news_themes_idx
  on public.news_articles using gin (themes);
