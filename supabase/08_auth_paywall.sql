-- ============================================================
-- TodayBrasil - Auth + Paywall
-- Rode no SQL Editor (uma vez). Antes, habilite Email no painel:
--   Authentication > Providers > Email (signup com senha).
--
-- Planos:
--   free    -> cadastro: 20 noticias, sem busca, sem "carregar mais"
--   pro     -> R$ 9,90/mes: tudo (feed completo, busca, lentes, Mundo)
--   caderno -> R$ 29,90/mes: pro + Caderno Inteligente (IA) [fase 2]
-- O plano so e alterado pelo webhook do PagBank (service role); o usuario
-- nunca edita o proprio plano.
-- ============================================================

create table if not exists public.profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  email                    text,
  plan                     text not null default 'free' check (plan in ('free', 'pro', 'caderno')),
  plan_expires_at          timestamptz,                 -- null = vitalicio/indef.; senao expira nessa data
  pagbank_customer_id      text,
  pagbank_subscription_id  text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- cada usuario LE so o proprio perfil. Escrita do plano: so service role (webhook).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

-- cria o perfil (free) automaticamente quando o usuario se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- log de eventos de pagamento (idempotencia + auditoria do webhook)
create table if not exists public.payment_events (
  id          bigint generated always as identity primary key,
  provider    text not null default 'pagbank',
  event_id    text unique,              -- id do evento no provedor (dedupe)
  user_id     uuid references auth.users(id) on delete set null,
  type        text,
  raw         jsonb,
  created_at  timestamptz not null default now()
);
alter table public.payment_events enable row level security;
-- sem policy: ninguem le/escreve via anon/auth; so service role (webhook).
