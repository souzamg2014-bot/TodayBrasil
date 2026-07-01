// TodayBrasil - Service Worker do Web Push (custo zero).
// Recebe o push enviado pelo servidor (motor de alertas) e mostra a notificacao.
// Ao clicar, abre a URL da noticia (ou a central de alertas).

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = data.title || "TodayBrasil";
  const options = {
    body: data.body || "",
    tag: data.tag || undefined,        // agrupa notificacoes do mesmo assunto
    data: { url: data.url || "/alertas" },
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/alertas";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(url) && "focus" in w) return w.focus();
      }
      return clients.openWindow(url);
    }),
  );
});
