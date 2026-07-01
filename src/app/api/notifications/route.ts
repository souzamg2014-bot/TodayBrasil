import { NextResponse } from "next/server";
import { getContext } from "@/lib/api-auth";

// Central de Alertas: notificacoes do usuario (a "verdade unica").
//   GET   /api/notifications                 -> lista (recentes) + contador nao-lidos
//   GET   /api/notifications?unread=count     -> so o contador (badge do sino)
//   PATCH /api/notifications {id} | {all:true} -> marca como lida(s)
//
// Recurso PAGO (pro | caderno). Leitura so via servidor (service role + filtro).
const PAGE = 30;

export async function GET(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.paid) return NextResponse.json({ error: "paid" }, { status: 403 });

  const sp = new URL(request.url).searchParams;

  // contador de nao-lidos (badge)
  const { count: unread } = await ctx.admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.userId)
    .is("read_at", null);

  if (sp.get("unread") === "count") {
    return NextResponse.json({ unread: unread ?? 0 });
  }

  const page = Math.max(0, parseInt(sp.get("page") ?? "0", 10) || 0);
  const { data, error } = await ctx.admin
    .from("notifications")
    .select("id, kind, value, title, body, url, read_at, created_at")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .range(page * PAGE, page * PAGE + PAGE - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: data ?? [],
    unread: unread ?? 0,
    hasMore: (data?.length ?? 0) === PAGE,
    page,
  });
}

export async function PATCH(request: Request) {
  const ctx = await getContext(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.paid) return NextResponse.json({ error: "paid" }, { status: 403 });

  let body: { id?: string; all?: boolean };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "json invalido" }, { status: 400 }); }

  const now = new Date().toISOString();
  let q = ctx.admin.from("notifications").update({ read_at: now }).eq("user_id", ctx.userId).is("read_at", null);
  if (!body.all) {
    if (!body.id) return NextResponse.json({ error: "id ou all:true" }, { status: 400 });
    q = q.eq("id", body.id);
  }
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
