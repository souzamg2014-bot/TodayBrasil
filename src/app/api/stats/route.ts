import { NextResponse } from "next/server";
import { getContext } from "@/lib/api-auth";

// termometro: setores em alta, mais buscados e termos em alta. Exige login.
// setores respeitam o escopo (?scope=br|mundo) para o ranking bater com o feed.
export async function GET(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const scope = new URL(request.url).searchParams.get("scope");
  const langs = scope === "mundo" ? ["en", "es"] : scope === "br" ? ["pt"] : null;

  const [sectors, searches, terms] = await Promise.all([
    // sector_counts_lang (15_stats_lang.sql); se ainda nao existir no banco, cai no antigo.
    ctx.admin.rpc("sector_counts_lang", { days: 7, langs }).then((r) =>
      r.error ? ctx.admin.rpc("sector_counts", { days: 7 }) : r,
    ),
    ctx.admin.rpc("top_searches", { days: 7, lim: 5 }),
    ctx.admin.rpc("trending_terms", { days: 3, lim: 18 }),
  ]);

  return NextResponse.json(
    {
      sectors: sectors.data ?? [],
      topSearches: searches.data ?? [],
      trending: terms.data ?? [],
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
