import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/api-auth";

// Lista os usuarios (so admin).
export async function GET(request: Request) {
  const ctx = await getAdmin(request);
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await ctx.admin
    .from("profiles")
    .select("id, email, plan, plan_expires_at, is_admin, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

// Altera o plano de um usuario (so admin). body: { id, plan, months? }
export async function POST(request: Request) {
  const ctx = await getAdmin(request);
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const id: string | undefined = body?.id;
  const plan: string | undefined = body?.plan;
  const months: number = Number(body?.months) || 1;
  if (!id || !["free", "pro", "caderno"].includes(plan ?? "")) {
    return NextResponse.json({ error: "dados invalidos" }, { status: 400 });
  }

  let plan_expires_at: string | null = null;
  if (plan === "pro" || plan === "caderno") {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    plan_expires_at = d.toISOString();
  }

  const { error } = await ctx.admin
    .from("profiles")
    .update({ plan, plan_expires_at, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, plan, plan_expires_at });
}
