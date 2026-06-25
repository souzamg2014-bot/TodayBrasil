-- ============================================================
-- TodayBrasil - limpa resumos-lixo (links) + termos em alta de verdade
-- Rode no SQL Editor depois do 01 e 02.
-- ============================================================

-- 1) Resumos que sao SO link do Google News (comecam com "a href" ou citam
--    news.google.com): zera, pra mostrar so o titulo, limpo.
update public.news_articles
set summary = null
where summary ~* '^\s*a?\s*href=' or summary ilike '%news.google.com%';

-- 2) Resumos mistos (texto real + links embutidos, ex: Folha): tira os restos
--    de link (href, urls, target, rel, _blank, entidades) e mantem o texto.
update public.news_articles
set summary = nullif(trim(
  regexp_replace(
    regexp_replace(summary,
      'href="[^"]*"|href=\S+|target="[^"]*"|rel="[^"]*"|https?://\S+|_blank|&[a-z#0-9]+;',
      ' ', 'gi'),
    '\s+', ' ', 'g')
), '')
where summary like '%href=%' or summary like '%http%';

-- 3) Termos em alta = palavras reais dos TITULOS recentes (sem stemming),
--    minusculas, sem palavras vazias. ndoc = em quantas noticias aparece.
create or replace function public.trending_terms(days int default 3, lim int default 18)
returns table(term text, ndoc int)
language sql
stable
security definer
set search_path = public
as $$
  with toks as (
    select n.id, t.w
    from public.news_articles n,
         lateral regexp_split_to_table(
           lower(n.title), '[^a-z0-9áàâãéêíóôõúûüçñ]+'
         ) as t(w)
    where coalesce(n.published_at, n.created_at) > now() - (days || ' days')::interval
      and char_length(t.w) >= 4
      and t.w !~ '^[0-9]+$'
  )
  select w as term, count(distinct id)::int as ndoc
  from toks
  where w not in (
    -- artigos, preposicoes, conjuncoes, pronomes, adverbios comuns
    'para','com','sem','por','pelo','pela','pelos','pelas','sobre','entre','contra',
    'desde','durante','apos','ante','ate','como','mais','menos','muito','muita',
    'muitos','muitas','pouco','pouca','poucos','poucas','todo','toda','todos','todas',
    'outro','outra','outros','outras','mesmo','mesma','cada','qualquer','algum','alguma',
    'alguns','algumas','nenhum','nenhuma','este','esta','estes','estas','esse','essa',
    'esses','essas','isso','isto','aquilo','aquele','aquela','aqui','ali','onde','quando',
    'quanto','quantos','qual','quais','quem','cujo','cuja','porque','pois','entao','assim',
    'ainda','agora','hoje','ontem','amanha','depois','antes','sempre','nunca','tambem',
    'apenas','somente','cerca','partir','atraves','dentro','fora','perto','longe',
    -- verbos/auxiliares e formas comuns
    'esta','estao','estava','estavam','sera','serao','seria','foram','sendo','sido',
    'tem','tinha','tinham','vai','vao','pode','podem','deve','devem','fazer','feito',
    'diz','dizem','disse','quer','querem','teve','havia','haver','poder','dever',
    -- ordinais/temporais e filler de manchete
    'primeiro','primeira','segundo','segunda','terceiro','terceira','ultimo','ultima',
    'novo','nova','novos','novas','grande','grandes','maior','menor','melhor','pior',
    'ano','anos','dia','dias','mes','meses','hora','horas','vez','vezes','parte',
    'pais','paises','sao','dos','das','uma','uns','umas','num','numa','nos','nas','aos',
    'mas','que','nao','sua','seu','suas','seus','ele','ela','eles','elas','voce',
    'ouca','comentario','video','veja','confira','saiba','entenda','assista','leia',
    'apareceu','aparece','primeiro','noticia','noticias'
  )
  group by w
  order by count(distinct id) desc, w
  limit lim;
$$;

grant execute on function public.trending_terms(int, int) to anon, authenticated;
