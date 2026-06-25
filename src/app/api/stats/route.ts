import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

// termometro da plataforma: setores em alta, mais buscados e termos em alta.
export async function GET() {
  const [sectors, searches, terms] = await Promise.all([
    supabase.rpc("sector_counts", { days: 7 }),
    supabase.rpc("top_searches", { days: 7, lim: 5 }),
    supabase.rpc("trending_terms", { days: 3, lim: 18 }),
  ]);

  return NextResponse.json(
    {
      sectors: sectors.data ?? [],
      topSearches: searches.data ?? [],
      trending: terms.data ?? [],
    },
    { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } },
  );
}
