import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getContext } from "@/lib/api-auth";

// Traducao de titulos sob demanda + cache (tabela translations, 17_translations.sql).
//   POST /api/translate  { target: "pt"|"en", items: [{ id, title, lang }] }
//   -> { translations: { [id]: "titulo traduzido" } }
// Motor: endpoint gratuito e sem chave (translate.googleapis.com, gtx). Fica
// isolado aqui: pra trocar por LibreTranslate/DeepL, mexe so na funcao translateOne.
// Resiliente: qualquer falha (motor ou tabela ausente) cai no titulo original.

const MAX_ITEMS = 40;

function hashOf(s: string): string {
  return createHash("sha1").update(s.trim().toLowerCase()).digest("hex");
}

async function translateOne(text: string, source: string, target: string): Promise<string | null> {
  const sl = source && source !== target ? source : "auto";
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${target}&dt=t&q=` +
    encodeURIComponent(text);
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return null;
    const data = await r.json();
    const segs = Array.isArray(data?.[0]) ? data[0] : [];
    const out = segs.map((s: unknown[]) => (Array.isArray(s) ? s[0] : "")).join("");
    return out.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { target?: string; items?: { id: string; title: string; lang?: string }[] };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "json invalido" }, { status: 400 }); }

  const target = body.target === "en" ? "en" : "pt";
  const items = (body.items ?? [])
    .filter((it) => it && it.id && it.title && (it.lang ?? "") !== target)
    .slice(0, MAX_ITEMS);
  if (items.length === 0) return NextResponse.json({ translations: {} });

  // hash de cada titulo de origem
  const withHash = items.map((it) => ({ ...it, h: hashOf(it.title) }));
  const hashes = [...new Set(withHash.map((it) => it.h))];

  // 1) cache existente
  const cache = new Map<string, string>();
  try {
    const { data } = await ctx.admin
      .from("translations")
      .select("hash, text")
      .eq("lang", target)
      .in("hash", hashes);
    for (const row of data ?? []) cache.set(row.hash, row.text);
  } catch { /* tabela ausente: segue so com o motor */ }

  // 2) traduz os que faltam (motor externo), 1 por titulo distinto
  const missing = hashes.filter((h) => !cache.has(h));
  const srcByHash = new Map(withHash.map((it) => [it.h, it.lang ?? "auto"]));
  const textByHash = new Map(withHash.map((it) => [it.h, it.title]));
  const novos: { hash: string; lang: string; text: string }[] = [];
  await Promise.all(
    missing.map(async (h) => {
      const txt = await translateOne(textByHash.get(h)!, srcByHash.get(h)!, target);
      if (txt) { cache.set(h, txt); novos.push({ hash: h, lang: target, text: txt }); }
    }),
  );

  // 3) grava os novos no cache (best-effort)
  if (novos.length) {
    try { await ctx.admin.from("translations").upsert(novos, { onConflict: "hash,lang" }); }
    catch { /* ignora: a traducao ja vai na resposta */ }
  }

  // 4) monta a resposta por id
  const translations: Record<string, string> = {};
  for (const it of withHash) {
    const t = cache.get(it.h);
    if (t) translations[it.id] = t;
  }
  return NextResponse.json({ translations });
}
