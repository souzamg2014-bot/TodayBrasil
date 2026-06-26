-- ============================================================
-- TodayBrasil - Paywall seguro (server-side)
-- Rode no SQL Editor (uma vez), DEPOIS de subir o codigo com a API por
-- service role. Fecha a leitura direta do conteudo: so o servidor le.
-- ============================================================

-- 1) news_articles: remove a leitura publica (anon/authenticated).
--    A partir daqui, SO a service role (a API no servidor) le. Ninguem
--    consegue baixar o acervo direto com a anon key.
drop policy if exists "news_public_read" on public.news_articles;
-- (sem policy de select = nenhum cliente le; service role ignora RLS)

-- 2) RPCs do termometro: tiram do anon (logado-fora nao chama).
--    A /api/stats chama via service role. 'authenticated' segue podendo,
--    mas a rota ja exige login de qualquer forma.
revoke execute on function public.sector_counts(int) from anon;
revoke execute on function public.top_searches(int, int) from anon;
revoke execute on function public.trending_terms(int, int) from anon;

-- 3) search_log: escrita so via service role (a API loga as buscas).
drop policy if exists "search_log_insert" on public.search_log;
alter table public.search_log enable row level security;
