-- ============================================================
-- TodayBrasil - Central de Alertas: correcao do FK das notificacoes.
--
-- Bug: notifications.article_id estava com ON DELETE CASCADE para news_articles.
-- Como o robo apaga noticia com +48h, o historico de notificacoes do usuario era
-- deletado junto. A notificacao ja guarda title/body/url proprios, entao deve
-- sobreviver. Troca para ON DELETE SET NULL.
--
-- Rode no SQL Editor (uma vez), depois do 13_alerts.sql.
-- ============================================================

alter table public.notifications
  drop constraint if exists notifications_article_id_fkey;

alter table public.notifications
  add constraint notifications_article_id_fkey
  foreign key (article_id) references public.news_articles(id) on delete set null;
