-- ============================================================
-- TodayBrasil - "Em alta" por ENTIDADES (empresas, pessoas, nomes compostos)
-- Heuristica: sequencias de palavras com inicial maiuscula nas manchetes,
-- ligadas por do/da/de/dos/das/e. Ex: "Banco do Brasil", "Camara dos Deputados".
-- Regra: so entra quem aparece em >= 5 noticias diferentes.
-- Rode no SQL Editor (substitui a funcao do 04).
-- ============================================================

create or replace function public.trending_terms(days int default 3, lim int default 18)
returns table(term text, ndoc int)
language sql
stable
security definer
set search_path = public
as $$
  with ent as (
    -- extrai cada nome proprio (1+ palavras maiusculas) de cada titulo
    select n.id, (g.arr)[1] as phrase
    from public.news_articles n
    cross join lateral regexp_matches(
      n.title,
      '[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ][a-zà-ÿ]+(?:\s+(?:d[aeo]s?\s+|e\s+)?[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ][a-zà-ÿ]+)*',
      'g'
    ) as g(arr)
    where coalesce(n.published_at, n.created_at) > now() - (days || ' days')::interval
  ),
  grp as (
    select
      lower(phrase) as k,
      -- mostra a grafia original mais comum (ex: "Banco do Brasil")
      mode() within group (order by phrase) as disp,
      count(distinct id) as ndoc
    from ent
    where char_length(phrase) >= 4
    group by lower(phrase)
  )
  select disp as term, ndoc::int
  from grp
  where ndoc >= 5  -- precisa aparecer em pelo menos 5 noticias diferentes
    and translate(k, 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn') not in (
      -- conectivos/preposicoes (raros como maiuscula, mas por seguranca)
      'para','com','sem','por','pelo','pela','sobre','entre','contra','desde',
      'durante','apos','ate','como','mais','menos','onde','quando','porque',
      -- VERBOS de manchete (ficam maiusculos no inicio do titulo)
      'anuncia','anunciam','lanca','lancam','aprova','aprovam','diz','dizem',
      'quer','querem','tem','vai','vao','pode','podem','deve','devem','cresce',
      'cai','sobe','abre','fecha','ganha','perde','faz','cria','recebe','mostra',
      'revela','confirma','define','adia','suspende','libera','amplia','reduz',
      'aumenta','vence','bate','chega','volta','segue','paga','compra','vende',
      'fica','entra','sai','tera','terao','sera','serao','vê','ve','propoe',
      'apresenta','registra','aponta','estuda','avalia','planeja','espera',
      -- generico / portais / secoes (nao servem de filtro)
      'portal','busca','giro','news','mercado','milhao','milhoes','milhar',
      'milhares','agrolink','migalhas','mundo','geral','brasil','noticia',
      'noticias','video','comentario','ouca','veja','confira','saiba','entenda',
      'leia','assista',
      -- palavras comuns que voce pediu pra remover
      'bilhoes','bilhao','commerce','empresas','empresa','dinheiro','agricolas',
      'agricola','deputados','deputado','alta','baixa','agencia','precos','preco',
      'anuncio','reais','dolar','real',
      -- temporais/ordinais e nomes comuns
      'ano','anos','dia','dias','mes','meses','hora','horas','vez','vezes',
      'novo','nova','novos','novas','grande','grandes','maior','menor','melhor',
      'pais','paises','primeiro','primeira','segundo','segunda','ultimo','ultima',
      'parte','grupo','setor','plano','projeto','lista','caso','meio','area'
    )
  order by ndoc desc, disp
  limit lim;
$$;

grant execute on function public.trending_terms(int, int) to anon, authenticated;
