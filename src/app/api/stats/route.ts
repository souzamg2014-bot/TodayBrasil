import { NextResponse } from "next/server";
import { getContext } from "@/lib/api-auth";

// termometro: setores em alta, mais buscados e termos em alta. Exige login.
export async function GET(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [sectors, searches, terms] = await Promise.all([
    ctx.admin.rpc("sector_counts", { days: 7 }),
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
