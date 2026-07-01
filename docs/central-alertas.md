# Central de Alertas (TodayBrasil)

Central inteligente de alertas, omnichannel e mobile-ready. **Fase 1 (no ar): central in-app + Web Push, custo zero.** WhatsApp, e-mail e camada semântica ficam para fases seguintes (exigem serviço/IA pagos).

## Arquitetura: 1 cérebro, vários braços

```
EVENTOS (ingestão)  ->  MOTOR (match-alerts.mjs)  ->  notifications  ->  CANAIS
 novas notícias          casa regra x notícia          (verdade única)     in-app (site/app)
                         dedupe + grava                                    Web Push
```

A tabela `notifications` é a fonte única: a central in-app lê dela; o Web Push reusa o mesmo registro. Quando o app mobile existir, é só mais um cliente lendo a mesma API.

## Peças

| Camada | Arquivo |
|---|---|
| Schema | `supabase/13_alerts.sql` (alert_rules, notifications, push_subscriptions) |
| Motor | `scripts/match-alerts.mjs` (+ `scripts/push-send.mjs`) |
| API | `src/app/api/alerts`, `src/app/api/notifications`, `src/app/api/push` |
| Front | `src/app/alertas/page.tsx` + `public/sw.js` |
| Cron | passo extra em `.github/workflows/ingest.yml` (roda após a ingestão) |

## Regras (o que o usuário monitora)
- `keyword`: termo livre (casa por substring normalizada, sem acento, em título+resumo)
- `sector`: 1 dos 18 setores
- `lente`: 1 das 9 lentes (M&A, Política, CVM, falências...)

Canais por regra: `in_app` (sempre) + `push` (opcional). Recurso **pago** (Pro/Premium): API e motor checam o plano.

## Passos para ativar

### 1. Rodar o SQL (obrigatório)
No Supabase, SQL Editor, rodar `supabase/13_alerts.sql` uma vez. Já libera a central in-app (config de alertas + notificações).

### 2. Web Push (custo zero)
Já feito localmente: `web-push` instalado e chaves VAPID geradas (estão no `.env.local`, gitignored). **Falta só publicar as 3 variáveis** nos ambientes:

- **Vercel** (Settings > Environment Variables): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- **GitHub** (repo > Settings > Secrets and variables > Actions): as mesmas 3 (o workflow já as referencia)

Copie os valores do `.env.local`. Sem elas nos ambientes, o push fica desativado em silêncio e a central in-app segue funcionando. Ícones já existem em `public/` (gerados por `scripts/gen-icons.mjs`).

### 3. PWA (instalável, custo zero)
Já configurado: `public/manifest.json`, ícones (`icon-192/512`, `apple-touch-icon`), `public/sw.js` (offline shell + push) e registro do SW via `components/PWARegister.tsx`. No celular, o navegador oferece "Adicionar à tela de início" e o site abre em tela cheia como app. É a base natural para um app nativo depois (Expo/wrapper reaprovei­tando a mesma API).

## Roadmap (próximas fases)
- **E-mail**: digest/na hora via Resend (free tier, precisa de domínio verificado). Já cabe como canal `email`.
- **WhatsApp**: assistente ativo (alerta) + receptivo (pergunta por texto/áudio, RAG). Exige provedor + IA (pago).
- **Semântica/contexto**: pgvector + embeddings para monitorar "contexto", não só palavra exata.
- **App mobile**: Expo consumindo a mesma API + push nativo (registra outro tipo de device em `push_subscriptions`).
