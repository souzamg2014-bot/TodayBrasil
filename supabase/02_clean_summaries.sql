-- ============================================================
-- TodayBrasil - limpeza dos resumos com HTML escapado + termos em alta
-- Rode no SQL Editor depois do 01_stats_and_search.sql.
-- ============================================================

-- 1) Limpa os resumos ja salvos: decodifica entidades, tira tags, normaliza
--    espacos. O fts (coluna gerada) se atualiza sozinho ao mudar o summary.
update public.news_articles
set summary = nullif(trim(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        replace(replace(replace(replace(replace(replace(summary,
          '&lt;','<'),'&gt;','>'),'&quot;','"'),'&#39;',''''),'&nbsp;',' '),'&amp;','&'),
      '<[^>]+>', ' ', 'g'),
    '&[a-z#0-9]+;', ' ', 'gi'),
  '\s+', ' ', 'g')
), '')
where summary is not null
  and (summary like '%&lt;%' or summary like '%<%'
       or summary like '%href=%' or summary like '%&amp;%' or summary like '%&#%');

-- 2) Termos em alta: so palavras (sem urls/numeros) e fora de uma blocklist
--    de lixo de HTML, como defesa extra.
create or replace function public.trending_terms(days int default 3, lim int default 15)
returns table(term text, ndoc int)
language sql
security definer
set search_path = public
as $$
  select word as term, ndoc
  from ts_stat(
    format(
      'select fts from public.news_articles where coalesce(published_at, created_at) > now() - interval ''%s days''',
      days
    )
  )
  where char_length(word) >= 3
    and word ~ '^[a-záàâãéêíóôõúûüç]+$'
    and word not in (
      'href','target','blank','www','http','https','span','div','img','src',
      'rel','nbsp','amp','quot','noopener','noreferrer','font','color','style',
      'class','html','strong','width','height'
    )
  order by ndoc desc
  limit lim;
$$;

grant execute on function public.trending_terms(int, int) to anon, authenticated;
