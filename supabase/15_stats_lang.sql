-- ============================================================
-- TodayBrasil - Setores em alta por IDIOMA (Brasil vs Mundo)
-- Variante de sector_counts que filtra por lang, para o ranking lateral
-- refletir o escopo atual do feed: Brasil (pt) ou Mundo (en/es).
-- langs = null  -> conta tudo (comportamento antigo).
-- Rode no SQL Editor (uma vez).
-- ============================================================

create or replace function public.sector_counts_lang(days int default 7, langs text[] default null)
returns table(sector text, n bigint)
language sql
security definer
set search_path = public
as $$
  select sector, count(*) as n
  from public.news_articles
  where coalesce(published_at, created_at) > now() - (days || ' days')::interval
    and (langs is null or lang = any(langs))
  group by sector
  order by n desc;
$$;

-- so usuarios logados (mesma regra do sector_counts); anon nao acessa o termometro.
revoke execute on function public.sector_counts_lang(int, text[]) from anon;
grant  execute on function public.sector_counts_lang(int, text[]) to authenticated;
