-- ============================================================
-- TodayBrasil - Central de Alertas (Fase 1 + Web Push)
--
-- Recurso PAGO (Pro/Premium). O usuario configura REGRAS (palavra-chave, setor
-- ou lente). O motor (scripts/match-alerts.mjs) roda apos a ingestao, cruza as
-- noticias novas com as regras e grava NOTIFICACOES. A central in-app (site e,
-- no futuro, app) le `notifications`. Web Push reusa a mesma notificacao.
--
-- Arquitetura: 1 cerebro (notifications), varios bracos (in-app, push, email,
-- whatsapp). Tudo aqui e custo zero: Postgres + Web Push (VAPID, sem servico pago).
--
-- Rode no SQL Editor (uma vez).
-- ============================================================

-- ---------- alert_rules: o que cada usuario monitora ----------
create table if not exists public.alert_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('keyword', 'sector', 'lente')),
  value       text not null,                         -- termo, id do setor ou id da lente
  label       text,                                  -- rotulo de exibicao (opcional)
  channels    text[] not null default '{in_app}',    -- in_app | push | email (whatsapp depois)
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, kind, value)                      -- nao duplica a mesma regra
);

create index if not exists alert_rules_user_idx   on public.alert_rules (user_id) where active;
create index if not exists alert_rules_active_idx on public.alert_rules (kind, value) where active;

alter table public.alert_rules enable row level security;

-- o usuario gerencia SO as proprias regras (CRUD). O motor usa service role.
drop policy if exists "alert_rules_select_own" on public.alert_rules;
create policy "alert_rules_select_own" on public.alert_rules
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "alert_rules_insert_own" on public.alert_rules;
create policy "alert_rules_insert_own" on public.alert_rules
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "alert_rules_update_own" on public.alert_rules;
create policy "alert_rules_update_own" on public.alert_rules
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "alert_rules_delete_own" on public.alert_rules;
create policy "alert_rules_delete_own" on public.alert_rules
  for delete to authenticated using (user_id = auth.uid());

-- ---------- notifications: a "verdade unica" dos alertas ----------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  rule_id     uuid references public.alert_rules(id) on delete set null,
  article_id  uuid references public.news_articles(id) on delete cascade,
  kind        text,                                  -- copia do kind da regra (display)
  value       text,                                  -- copia do value da regra (display)
  title       text not null,
  body        text,
  url         text,
  read_at     timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, article_id)                       -- dedupe: 1 alerta por usuario+noticia
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

-- o usuario LE e MARCA COMO LIDA as proprias. Insercao: so service role (o motor).
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- push_subscriptions: Web Push (VAPID, custo zero) ----------
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,                  -- endpoint do navegador (unico por device)
  p256dh      text not null,                         -- chave publica do device
  auth        text not null,                         -- segredo do device
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists push_subs_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- o usuario gerencia as proprias inscricoes de push. O envio usa service role.
drop policy if exists "push_subs_select_own" on public.push_subscriptions;
create policy "push_subs_select_own" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "push_subs_insert_own" on public.push_subscriptions;
create policy "push_subs_insert_own" on public.push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "push_subs_delete_own" on public.push_subscriptions;
create policy "push_subs_delete_own" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());
