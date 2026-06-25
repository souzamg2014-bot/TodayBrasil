-- ============================================================
-- TodayBrasil - termos em alta: comparacao SEM acento + mais stopwords
-- Rode no SQL Editor (substitui a funcao do 03).
-- ============================================================

create or replace function public.trending_terms(days int default 3, lim int default 18)
returns table(term text, ndoc int)
language sql
stable
security definer
set search_path = public
as $$
  with toks as (
    select
      n.id,
      t.w as w,
      -- versao sem acento, so para comparar com a blocklist
      translate(t.w, 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn') as wn
    from public.news_articles n,
         lateral regexp_split_to_table(
           lower(n.title), '[^a-z0-9áàâãäéèêëíìîïóòôõöúùûüçñ]+'
         ) as t(w)
    where coalesce(n.published_at, n.created_at) > now() - (days || ' days')::interval
      and char_length(t.w) >= 4
      and t.w !~ '^[0-9]+$'
  )
  select w as term, count(distinct id)::int as ndoc
  from toks
  where wn not in (
    -- artigos, preposicoes, conjuncoes, pronomes, adverbios
    'para','com','sem','por','pelo','pela','pelos','pelas','sobre','entre','contra',
    'desde','durante','apos','ante','ate','como','mais','menos','muito','muita',
    'muitos','muitas','pouco','pouca','poucos','poucas','todo','toda','todos','todas',
    'outro','outra','outros','outras','mesmo','mesma','cada','qualquer','algum','alguma',
    'alguns','algumas','nenhum','nenhuma','este','esta','estes','estas','esse','essa',
    'esses','essas','isso','isto','aquilo','aquele','aquela','aqui','ali','onde','quando',
    'quanto','quantos','qual','quais','quem','cujo','cuja','porque','pois','entao','assim',
    'ainda','agora','hoje','ontem','amanha','depois','antes','sempre','nunca','tambem',
    'apenas','somente','cerca','partir','atraves','dentro','fora','perto','longe',
    -- verbos/auxiliares
    'esta','estao','estava','estavam','sera','serao','seria','foram','sendo','sido',
    'tem','tinha','tinham','vai','vao','pode','podem','deve','devem','fazer','feito',
    'diz','dizem','disse','quer','querem','teve','havia','haver','poder','dever','tera',
    -- ordinais/temporais e filler de manchete
    'primeiro','primeira','segundo','segunda','terceiro','terceira','ultimo','ultima',
    'novo','nova','novos','novas','grande','grandes','maior','menor','melhor','pior',
    'ano','anos','dia','dias','mes','meses','hora','horas','vez','vezes','parte',
    'pais','paises','sao','dos','das','uma','uns','umas','num','numa','nos','nas','aos',
    'mas','que','nao','sua','seu','suas','seus','ele','ela','eles','elas','voce',
    'ouca','comentario','comentarios','video','veja','confira','saiba','entenda',
    'assista','leia','apareceu','aparece','noticia','noticias',
    -- generico / nomes de portais e secoes (nao servem como filtro)
    'portal','busca','giro','news','mercado','milhao','milhoes','milhar','milhares',
    'agrolink','migalhas','mundo','geral','brasil'
  )
  group by w
  order by count(distinct id) desc, w
  limit lim;
$$;

grant execute on function public.trending_terms(int, int) to anon, authenticated;
