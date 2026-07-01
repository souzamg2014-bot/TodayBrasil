-- ============================================================
-- TodayBrasil - Cache de traducoes (titulos de noticia)
-- Traducao sob demanda: quando alguem ve uma noticia no outro idioma, a
-- /api/translate traduz o titulo (motor externo gratuito) e guarda aqui.
-- Chave = hash do texto de origem + idioma-alvo (dedupa titulos iguais e
-- sobrevive a` limpeza de news_articles). So o servidor (service role) acessa.
-- Rode no SQL Editor (uma vez).
-- ============================================================

create table if not exists public.translations (
  hash       text not null,              -- sha1 do texto de origem (normalizado)
  lang       text not null,              -- idioma-alvo (pt | en)
  text       text not null,              -- traducao
  created_at timestamptz not null default now(),
  primary key (hash, lang)
);

alter table public.translations enable row level security;
-- sem policy: nenhum cliente le/escreve direto; tudo passa pela /api/translate
-- (service role, que ignora RLS).
