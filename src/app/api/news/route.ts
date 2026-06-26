import { NextResponse } from "next/server";
import { getContext } from "@/lib/api-auth";
import { FREE_LIMIT } from "@/lib/plans";

const PAGE = 24;

export async function GET(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const sectorsRaw = (sp.get("sector") ?? "all").split(",").map((s) => s.trim()).filter(Boolean);
  const sectors = sectorsRaw.filter((s) => s !== "all");
  const themes = (sp.get("theme") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const langs = (sp.get("lang") ?? "pt").split(",").map((s) => s.trim()).filter(Boolean);

  // ---- PAYWALL no servidor (nao confia no front) ----
  const q = ctx.paid ? (sp.get("q") ?? "").trim() : "";          // busca: so Pro
  const page = ctx.paid ? Math.max(0, parseInt(sp.get("page") ?? "0", 10) || 0) : 0; // free: so pagina 0
  const limit = ctx.paid ? PAGE : FREE_LIMIT;                     // free: 20 itens

  let query = ctx.admin
    .from("news_articles")
    .select("id, title, summary, source, url, sector, themes, published_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(page * limit, page * limit + limit - 1);

  if (langs.length === 1) query = query.eq("lang", langs[0]);
  else if (langs.length > 1) query = query.in("lang", langs);
  if (sectors.length === 1) query = query.eq("sector", sectors[0]);
  else if (sectors.length > 1) query = query.in("sector", sectors);
  if (themes.length) query = query.overlaps("themes", themes);
  if (q) query = query.textSearch("fts", q, { type: "websearch", config: "portuguese" });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data ?? [];

  // registra a busca (so 1a pagina, termos com >=3 chars) - via service role
  if (q.length >= 3 && page === 0) {
    ctx.admin.from("search_log").insert({ q: q.slice(0, 120), results_count: items.length }).then(() => {}, () => {});
  }

  return NextResponse.json({
    items,
    hasMore: ctx.paid ? items.length === PAGE : false,
    page,
  });
}
