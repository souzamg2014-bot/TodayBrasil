-- ============================================================
-- TodayBrasil - Caderno Exclusivo (materias escritas por nos via IA)
-- Acesso so no plano Exclusivo (id 'caderno'). Leitura SO via servidor
-- (service role); a API checa o plano. Favoritos: cada um le/escreve o seu.
-- Rode no SQL Editor (uma vez).
-- ============================================================

create table if not exists public.caderno_articles (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique,
  tema        text not null,                 -- m&a | startup | inovacao | industria | politica
  titulo      text not null,
  highlight   text,                          -- chamada/destaque (1-2 frases)
  resumo      text,                          -- resumo executivo
  conteudo    text,                          -- materia completa (markdown)
  fontes      jsonb default '[]'::jsonb,     -- [{titulo,url}] das fontes usadas
  imagem_url  text,
  autor       text default 'Redação TodayBrasil',
  publicado   boolean not null default true,
  published_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index if not exists caderno_pub_idx on public.caderno_articles (published_at desc);
create index if not exists caderno_tema_idx on public.caderno_articles (tema, published_at desc);

alter table public.caderno_articles enable row level security;
-- sem policy de select: nenhum cliente le direto; a /api/caderno (service role) entrega
-- so para quem e do plano Exclusivo.

create table if not exists public.caderno_favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.caderno_articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
alter table public.caderno_favorites enable row level security;

-- cada usuario gerencia so os proprios favoritos
drop policy if exists "fav_select_own" on public.caderno_favorites;
create policy "fav_select_own" on public.caderno_favorites
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "fav_insert_own" on public.caderno_favorites;
create policy "fav_insert_own" on public.caderno_favorites
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "fav_delete_own" on public.caderno_favorites;
create policy "fav_delete_own" on public.caderno_favorites
  for delete to authenticated using (user_id = auth.uid());
