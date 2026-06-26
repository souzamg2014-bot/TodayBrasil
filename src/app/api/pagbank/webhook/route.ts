import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Webhook do PagBank: marca o usuario como Pro/Caderno quando o pagamento confirma.
// Usa a service role (ignora RLS). Precisa de SUPABASE_SERVICE_ROLE_KEY no ambiente
// do servidor (Vercel). Idempotente via payment_events.event_id.
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });

  // TODO (com a chave): validar a autenticidade da notificacao do PagBank
  // (assinatura/secret) antes de confiar no payload.

  // TODO: extrair do payload conforme o formato do PagBank:
  const eventId: string | undefined = body.id ?? body.notificationCode;
  const userId: string | undefined = body.reference_id; // setado no checkout
  const status: string | undefined = body.charges?.[0]?.status ?? body.status;
  const isPaid = ["PAID", "AVAILABLE", "ACTIVE", "APPROVED"].includes(String(status).toUpperCase());

  const sb = admin();

  // log + dedupe
  if (eventId) {
    const { error } = await sb.from("payment_events").insert({
      provider: "pagbank", event_id: eventId, user_id: userId ?? null, type: status, raw: body,
    });
    if (error && error.code === "23505") return NextResponse.json({ ok: true, dup: true }); // ja processado
  }

  if (isPaid && userId) {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1); // +1 mes (recorrencia renova a cada cobranca)
    await sb.from("profiles").update({
      plan: "pro", // TODO: 'caderno' quando for o plano de R$ 29,90
      plan_expires_at: expires.toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
  }

  return NextResponse.json({ ok: true });
}
