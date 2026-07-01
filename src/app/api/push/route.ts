import { NextResponse } from "next/server";
import { getContext } from "@/lib/api-auth";

// Web Push (custo zero, via VAPID). Gerencia a inscricao do navegador do usuario.
//   GET    /api/push                 -> { publicKey } (chave VAPID publica p/ o browser)
//   POST   /api/push { subscription } -> salva a inscricao (endpoint + chaves)
//   DELETE /api/push { endpoint }     -> remove a inscricao (ao desativar)
//
// Recurso PAGO (pro | caderno). O envio em si fica no motor (server) com a chave
// privada. Sem servico externo: o proprio navegador entrega a notificacao.
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export async function GET(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.paid) return NextResponse.json({ error: "paid" }, { status: 403 });
  if (!PUBLIC_KEY) return NextResponse.json({ error: "push nao configurado" }, { status: 503 });
  return NextResponse.json({ publicKey: PUBLIC_KEY });
}

export async function POST(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.paid) return NextResponse.json({ error: "paid" }, { status: 403 });

  let body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "json invalido" }, { status: 400 }); }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "subscription invalida" }, { status: 400 });
  }

  // upsert por endpoint (re-inscrever o mesmo device nao duplica)
  const { error } = await ctx.admin
    .from("push_subscriptions")
    .upsert(
      {
        user_id: ctx.userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
      },
      { onConflict: "endpoint" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.paid) return NextResponse.json({ error: "paid" }, { status: 403 });

  let body: { endpoint?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "json invalido" }, { status: 400 }); }
  if (!body.endpoint) return NextResponse.json({ error: "endpoint ausente" }, { status: 400 });

  const { error } = await ctx.admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint)
    .eq("user_id", ctx.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
