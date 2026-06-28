-- ============================================================
-- TodayBrasil - Resumos Inteligentes (premium on-site)
-- Por TEMA (5) e por JANELA de tempo (manha|tarde|noite), agregamos o maior
-- numero de fontes do dia num unico card que resume o que aconteceu.
-- Acesso so no plano Premium (id de storage 'caderno'). Leitura SO via servidor
-- (service role): a /api/resumos checa o plano. Sem policy de select no cliente.
-- Rode no SQL Editor (uma vez).
--
-- Janelas (cobrem 24h):
--   manha = 18:00(d-1) -> 07:00   | tarde = 07:00 -> 13:00 | noite = 13:00 -> 18:00
-- ============================================================

create table if not exists public.resumos (
  id           uuid primary key default gen_random_uuid(),
  tema         text not null,                 -- ma | startup | inovacao | industria | politica
  janela       text not null,                 -- manha | tarde | noite
  data_ref     date not null,                 -- dia de referencia do resumo
  titulo       text not null,
  resumo       text,                          -- panorama agregado (markdown)
  destaques    jsonb not null default '[]'::jsonb,  -- [{fato, fonte, url}]
  fontes       jsonb not null default '[]'::jsonb,  -- [{titulo, url}] cruzadas
  n_fontes     integer not null default 0,    -- quantas fontes foram cruzadas
  publicado    boolean not null default true,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique (tema, janela, data_ref)             -- upsert idempotente (re-rodar atualiza)
);

create index if not exists resumos_pub_idx  on public.resumos (data_ref desc, published_at desc);
create index if not exists resumos_tema_idx on public.resumos (tema, data_ref desc);

alter table public.resumos enable row level security;
-- sem policy de select: nenhum cliente le direto; a /api/resumos (service role)
-- entrega so para quem e do plano Premium (storage id 'caderno').
