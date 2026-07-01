import { NextResponse } from "next/server";
import { getContext } from "@/lib/api-auth";

// Central de Alertas: CRUD das regras do usuario. Recurso PAGO (pro | caderno).
//   GET    /api/alerts              -> lista as regras do usuario
//   POST   /api/alerts {kind,value,label?,channels?} -> cria/atualiza uma regra
//   DELETE /api/alerts?id=<uuid>    -> remove uma regra
//
// kind: keyword | sector | lente. channels: in_app | push | email (subset).
const KINDS = new Set(["keyword", "sector", "lente"]);
const CHANNELS = new Set(["in_app", "push", "email"]);
const MAX_RULES = 50; // teto de seguranca por usuario

export async function GET(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.paid) return NextResponse.json({ error: "paid" }, { status: 403 });

  const { data, error } = await ctx.admin
    .from("alert_rules")
    .select("id, kind, value, label, channels, active, created_at")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.paid) return NextResponse.json({ error: "paid" }, { status: 403 });

  let body: { kind?: string; value?: string; label?: string; channels?: string[] };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "json invalido" }, { status: 400 }); }

  const kind = (body.kind ?? "").trim();
  const rawValue = (body.value ?? "").trim();
  if (!KINDS.has(kind)) return NextResponse.json({ error: "kind invalido" }, { status: 400 });
  if (!rawValue || rawValue.length > 120) return NextResponse.json({ error: "value invalido" }, { status: 400 });
  // normaliza o value (minusculo) p/ unicidade e match case-insensitive; guarda o
  // texto original em `label` para exibir a palavra-chave como o usuario digitou.
  const value = rawValue.toLowerCase();
  const label = body.label?.slice(0, 80) ?? (kind === "keyword" ? rawValue : null);

  const channels = (Array.isArray(body.channels) ? body.channels : ["in_app"])
    .filter((c) => CHANNELS.has(c));
  if (!channels.includes("in_app")) channels.unshift("in_app"); // in_app sempre presente

  // teto de regras: so bloqueia se for regra NOVA (nao um update da mesma kind+value)
  const { data: existing } = await ctx.admin
    .from("alert_rules")
    .select("id")
    .eq("user_id", ctx.userId).eq("kind", kind).eq("value", value)
    .maybeSingle();
  if (!existing) {
    const { count } = await ctx.admin
      .from("alert_rules")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.userId);
    if ((count ?? 0) >= MAX_RULES) {
      return NextResponse.json({ error: "limite de regras atingido" }, { status: 409 });
    }
  }

  const row = { user_id: ctx.userId, kind, value, label, channels, active: true };
  const { data, error } = await ctx.admin
    .from("alert_rules")
    .upsert(row, { onConflict: "user_id,kind,value" })
    .select("id, kind, value, label, channels, active, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rule: data });
}

export async function DELETE(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.paid) return NextResponse.json({ error: "paid" }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

  const { error } = await ctx.admin
    .from("alert_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.userId); // so apaga a propria regra
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
