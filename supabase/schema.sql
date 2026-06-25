-- ============================================================
-- newsfeed - schema do feed publico de noticias
-- Rode no SQL Editor do Supabase (uma vez).
-- ============================================================

-- ---------- news_articles (o que o robo coleta) ----------
create table if not exists public.news_articles (
  id            uuid primary key default gen_random_uuid(),
  lang          text not null default 'pt',   -- 'pt' agora; 'en' / 'es' na fase 2
  sector        text not null default 'geral',
  title         text not null,
  summary       text,
  source        text,
  url           text unique,
  image_url     text,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  -- busca full-text (gerada): titulo + resumo, com stemming PT
  fts tsvector generated always as (
    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, ''))
  ) stored
);

-- indices para o feed
create index if not exists news_published_idx
  on public.news_articles (published_at desc nulls last);
create index if not exists news_sector_published_idx
  on public.news_articles (sector, published_at desc nulls last);
create index if not exists news_lang_published_idx
  on public.news_articles (lang, published_at desc nulls last);
create index if not exists news_fts_idx
  on public.news_articles using gin (fts);

alter table public.news_articles enable row level security;

-- leitura publica (feed gratis, sem login). escrita: so via service role (o robo).
drop policy if exists "news_public_read" on public.news_articles;
create policy "news_public_read" on public.news_articles
  for select to anon, authenticated using (true);
