import { NextResponse } from "next/server";
import { getContext } from "@/lib/api-auth";

// termometro: setores em alta, mais buscados e termos em alta. Exige login.
// setores respeitam o escopo (?scope=br|mundo) para o ranking bater com o feed.
export async function GET(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const scope = new URL(request.url).searchParams.get("scope");
  const mundo = scope === "mundo";
  // Mundo = idiomas != pt; Brasil = pt.
  const NON_PT = ["en", "es", "de", "fr", "it", "nl"];
  const langs = mundo ? NON_PT : ["pt"];

  const [sectors, searches, terms, countries] = await Promise.all([
    // sector_counts_lang (15_stats_lang.sql); se ainda nao existir no banco, cai no antigo.
    ctx.admin.rpc("sector_counts_lang", { days: 7, langs }).then((r) =>
      r.error ? ctx.admin.rpc("sector_counts", { days: 7 }) : r,
    ),
    ctx.admin.rpc("top_searches", { days: 7, lim: 5 }),
    ctx.admin.rpc("trending_terms", { days: 3, lim: 18 }),
    // paises em alta (so no Mundo; country_counts do 16_country.sql)
    mundo ? ctx.admin.rpc("country_counts", { days: 7 }) : Promise.resolve({ data: [] }),
  ]);

  return NextResponse.json(
    {
      sectors: sectors.data ?? [],
      topSearches: searches.data ?? [],
      trending: terms.data ?? [],
      countries: countries.data ?? [],
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
