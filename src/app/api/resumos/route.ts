import { NextResponse } from "next/server";
import { getContext } from "@/lib/api-auth";

// Resumos Inteligentes: agora são AMOSTRAS do produto de inteligência (clipping),
// exibidas na tela de venda. Leitura liberada para qualquer usuário autenticado
// (não é mais conteúdo pago). Um resumo por setor por dia.
//   GET /api/resumos            -> lista (mais recentes primeiro)
//   GET /api/resumos?tema=agro  -> filtra por setor
export async function GET(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tema = new URL(request.url).searchParams.get("tema");

  let query = ctx.admin
    .from("resumos")
    .select("id, tema, janela, data_ref, titulo, resumo, destaques, fontes, n_fontes, published_at")
    .eq("publicado", true)
    .order("data_ref", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(120);
  if (tema) query = query.eq("tema", tema);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resumos: data ?? [] });
}
