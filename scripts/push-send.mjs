// ============================================================
// TodayBrasil - envio de Web Push (custo zero, VAPID).
//
// Modulo OPCIONAL: se a lib `web-push` nao estiver instalada ou as chaves VAPID
// nao estiverem no ambiente, ele se desativa em silencio (a central in-app segue
// funcionando normalmente). Para ligar o push:
//   1) npm i web-push           (dependencia open-source, gratuita)
//   2) npx web-push generate-vapid-keys
//   3) no ambiente: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
//      (ex.: VAPID_SUBJECT="mailto:contato@todaybrasil.com.br")
//
// Sem servico externo: o proprio navegador do usuario entrega a notificacao.
// ============================================================

let webpush = null;
let ready = false;

export async function initPush() {
  if (ready) return !!webpush;
  ready = true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contato@todaybrasil.com.br";
  if (!pub || !priv) return false; // chaves ausentes -> push desativado
  try {
    const mod = await import("web-push");
    webpush = mod.default ?? mod;
    webpush.setVapidDetails(subject, pub, priv);
    return true;
  } catch {
    webpush = null; // lib nao instalada -> push desativado (sem erro)
    return false;
  }
}

// Envia uma notificacao para todas as inscricoes do usuario.
// `subs` = linhas de push_subscriptions [{ id, endpoint, p256dh, auth }].
// Retorna a lista de endpoints invalidos (404/410) p/ o chamador remover.
export async function sendToSubs(subs, payload) {
  if (!webpush || !subs?.length) return [];
  const dead = [];
  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (e) {
        const code = e?.statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint); // inscricao expirada
      }
    }),
  );
  return dead;
}
