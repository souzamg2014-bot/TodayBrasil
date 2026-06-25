import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// leitura publica via chave anonima (RLS libera select para anon)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

const PAGE = 24;

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  // setor pode vir como lista: ?sector=tecnologia-software,industria
  const sectorsRaw = (sp.get("sector") ?? "all")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sectors = sectorsRaw.filter((s) => s !== "all");
  // lentes (temas que cruzam setores): ?theme=ma  ou  ?theme=ma,investimentos
  const themes = (sp.get("theme") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const q = (sp.get("q") ?? "").trim();
  const lang = sp.get("lang") ?? "pt";
  const page = Math.max(0, parseInt(sp.get("page") ?? "0", 10) || 0);

  let query = supabase
    .from("news_articles")
    .select("id, title, summary, source, url, sector, themes, published_at")
    .eq("lang", lang)
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(page * PAGE, page * PAGE + PAGE - 1);

  if (sectors.length === 1) query = query.eq("sector", sectors[0]);
  else if (sectors.length > 1) query = query.in("sector", sectors);
  // lente: noticia precisa ter ao menos uma das lentes pedidas (overlap &&)
  if (themes.length) query = query.overlaps("themes", themes);
  // busca full-text no titulo + resumo (config portuguese, com stemming)
  if (q) query = query.textSearch("fts", q, { type: "websearch", config: "portuguese" });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data ?? [];

  // registra a busca (so na 1a pagina, termos com >=3 chars) para o termometro.
  // best-effort: nao bloqueia nem derruba a resposta se falhar.
  if (q.length >= 3 && page === 0) {
    supabase
      .from("search_log")
      .insert({ q: q.slice(0, 120), results_count: items.length })
      .then(() => {}, () => {});
  }

  return NextResponse.json({ items, hasMore: items.length === PAGE, page });
}
