import { NextResponse } from "next/server";
import { getContext } from "@/lib/api-auth";

// Caderno Exclusivo: leitura so para o plano Exclusivo (id 'caderno', ativo).
//   GET /api/caderno            -> lista (sem conteudo)
//   GET /api/caderno?tema=m&a   -> filtra por tema
//   GET /api/caderno?slug=...   -> 1 materia completa
export async function GET(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const exclusivo = ctx.plan === "caderno" && ctx.paid;
  if (!exclusivo) return NextResponse.json({ error: "exclusivo" }, { status: 403 });

  const sp = new URL(request.url).searchParams;
  const slug = sp.get("slug");
  const tema = sp.get("tema");

  if (slug) {
    const { data, error } = await ctx.admin
      .from("caderno_articles")
      .select("id, slug, tema, titulo, highlight, resumo, conteudo, fontes, imagem_url, autor, published_at")
      .eq("slug", slug)
      .eq("publicado", true)
      .single();
    if (error) return NextResponse.json({ error: "nao encontrado" }, { status: 404 });
    return NextResponse.json({ article: data });
  }

  let query = ctx.admin
    .from("caderno_articles")
    .select("id, slug, tema, titulo, highlight, resumo, imagem_url, autor, published_at")
    .eq("publicado", true)
    .order("published_at", { ascending: false })
    .limit(100);
  if (tema) query = query.eq("tema", tema);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles: data ?? [] });
}
