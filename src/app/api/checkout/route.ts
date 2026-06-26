import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicia a assinatura (Pro R$ 9,90). O front manda o token do usuario no header.
// Enquanto PAGBANK_TOKEN nao existir, retorna uma mensagem amigavel.
export async function POST(request: Request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ message: "Faça login para assinar." }, { status: 401 });

  const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
  if (!PAGBANK_TOKEN) {
    // ainda sem chave: o botao mostra essa mensagem
    return NextResponse.json({ message: "Assinatura em configuração. Em breve!" });
  }

  // TODO (quando a chave estiver pronta): criar a assinatura/checkout no PagBank
  //   - usar a API de Assinaturas (planos recorrentes) ou Checkout
  //   - reference_id = user.id (pra reconciliar no webhook)
  //   - notification_url = <site>/api/pagbank/webhook
  //   - devolver { url } com o link de pagamento
  // Ex.:
  //   const r = await fetch("https://api.pagbank.com/...", {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${PAGBANK_TOKEN}`, "Content-Type": "application/json" },
  //     body: JSON.stringify({ reference_id: user.id, plan: process.env.PAGBANK_PLAN_PRO, ... }),
  //   });
  //   const j = await r.json();
  //   return NextResponse.json({ url: j.checkoutUrl });

  return NextResponse.json({ message: "Checkout PagBank a configurar." });
}
