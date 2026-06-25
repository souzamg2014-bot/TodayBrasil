-- ============================================================
-- TodayBrasil - termometro (stats) + registro de buscas
-- Rode no SQL Editor do Supabase (uma vez), depois do schema.sql.
-- ============================================================

-- ---------- search_log (o que os usuarios buscam) ----------
create table if not exists public.search_log (
  id            uuid primary key default gen_random_uuid(),
  q             text not null,
  results_count int,
  created_at    timestamptz not null default now()
);

create index if not exists search_log_created_idx
  on public.search_log (created_at desc);

alter table public.search_log enable row level security;

-- O feed publico (chave anon) pode REGISTRAR uma busca, mas nao pode ler o log cru.
-- A leitura agregada sai pelas funcoes abaixo (security definer).
drop policy if exists "search_log_anon_insert" on public.search_log;
create policy "search_log_anon_insert" on public.search_log
  for insert to anon, authenticated with check (true);

-- ---------- setores em alta (quantas noticias por setor na janela) ----------
create or replace function public.sector_counts(days int default 7)
returns table(sector text, n bigint)
language sql
security definer
set search_path = public
as $$
  select sector, count(*) as n
  from public.news_articles
  where coalesce(published_at, created_at) > now() - (days || ' days')::interval
  group by sector
  order by n desc;
$$;

-- ---------- termos mais buscados (ranking real de usuarios) ----------
create or replace function public.top_searches(days int default 7, lim int default 12)
returns table(q text, hits bigint)
language sql
security definer
set search_path = public
as $$
  select lower(trim(q)) as q, count(*) as hits
  from public.search_log
  where created_at > now() - (days || ' days')::interval
    and length(trim(q)) >= 2
  group by lower(trim(q))
  order by hits desc
  limit lim;
$$;

-- ---------- termos em alta (frequencia nas proprias noticias) ----------
-- Usa ts_stat sobre o indice full-text: para cada lexema, ndoc = em quantas
-- noticias ele aparece. Ja vem sem stopwords (config 'portuguese' do fts).
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
  order by ndoc desc
  limit lim;
$$;

-- Libera execucao das funcoes para o feed publico (chave anon) e logados.
grant execute on function public.sector_counts(int)        to anon, authenticated;
grant execute on function public.top_searches(int, int)    to anon, authenticated;
grant execute on function public.trending_terms(int, int)  to anon, authenticated;
