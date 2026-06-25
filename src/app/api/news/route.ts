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
  const sector = sp.get("sector");
  const q = (sp.get("q") ?? "").trim();
  const lang = sp.get("lang") ?? "pt";
  const page = Math.max(0, parseInt(sp.get("page") ?? "0", 10) || 0);

  let query = supabase
    .from("news_articles")
    .select("id, title, summary, source, url, image_url, sector, published_at")
    .eq("lang", lang)
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(page * PAGE, page * PAGE + PAGE - 1);

  if (sector && sector !== "all") query = query.eq("sector", sector);
  if (q) query = query.textSearch("fts", q, { type: "websearch", config: "portuguese" });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data ?? [];
  return NextResponse.json({ items, hasMore: items.length === PAGE, page });
}
