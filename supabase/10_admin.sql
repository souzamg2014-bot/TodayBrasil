-- ============================================================
-- TodayBrasil - Admin (gerenciar usuarios)
-- Rode no SQL Editor DEPOIS de ter criado sua conta no site (pra existir
-- o perfil). Troque o e-mail se necessario.
-- ============================================================

alter table public.profiles add column if not exists is_admin boolean not null default false;

-- define o(s) admin(s)
update public.profiles set is_admin = true
where email = 'souza.mg2014@gmail.com';

-- conferir:
-- select email, plan, is_admin from public.profiles where is_admin;
