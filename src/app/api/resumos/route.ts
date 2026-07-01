import { NextResponse } from "next/server";
import { getContext } from "@/lib/api-auth";

// Resumos Inteligentes: leitura para qualquer plano pago (Pro, ativo).
//   GET /api/resumos            -> lista (mais recentes primeiro)
//   GET /api/resumos?tema=ma    -> filtra por tema
//   GET /api/resumos?janela=tarde -> filtra por janela
export async function GET(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.paid) return NextResponse.json({ error: "paid" }, { status: 403 });

  const sp = new URL(request.url).searchParams;
  const tema = sp.get("tema");
  const janela = sp.get("janela");

  let query = ctx.admin
    .from("resumos")
    .select("id, tema, janela, data_ref, titulo, resumo, destaques, fontes, n_fontes, published_at")
    .eq("publicado", true)
    .order("data_ref", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(120);
  if (tema) query = query.eq("tema", tema);
  if (janela) query = query.eq("janela", janela);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resumos: data ?? [] });
}
