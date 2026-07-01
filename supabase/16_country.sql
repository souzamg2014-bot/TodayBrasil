-- ============================================================
-- TodayBrasil - Pais da noticia (barra lateral de paises no "Mundo")
-- Adiciona news_articles.country (codigo do pais/regiao, ex.: US, GB, CN, BR).
-- A ingestao (scripts/ingest-news.mjs + sources.intl.mjs) grava o country;
-- fontes PT-BR recebem 'BR'. O feed "Mundo" filtra country <> 'BR'.
-- Rode no SQL Editor (uma vez).
-- ============================================================

alter table public.news_articles add column if not exists country text;

create index if not exists news_country_idx
  on public.news_articles (country, published_at desc)
  where country is not null;

-- contagem de noticias por pais nos ultimos N dias (so Mundo, country <> 'BR').
-- alimenta a barra lateral de paises (via /api/stats?scope=mundo).
create or replace function public.country_counts(days int default 7)
returns table(country text, n bigint)
language sql
security definer
set search_path = public
as $$
  select country, count(*) as n
  from public.news_articles
  where coalesce(published_at, created_at) > now() - (days || ' days')::interval
    and country is not null
    and country <> 'BR'
  group by country
  order by n desc;
$$;

revoke execute on function public.country_counts(int) from anon;
grant  execute on function public.country_counts(int) to authenticated;
