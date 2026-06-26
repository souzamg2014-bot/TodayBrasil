// Auth no servidor (somente rotas /api). Valida o JWT do usuario e resolve o
// plano via service role. NUNCA importar isto em componentes de cliente.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isPaid, type Plan } from "./plans";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// cliente com a service role (ignora RLS) - so no servidor
export function admin(): SupabaseClient {
  return createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export type Ctx = {
  userId: string;
  email: string | undefined;
  plan: Plan;
  exp: string | null;
  paid: boolean;
  admin: SupabaseClient;
};

// retorna o contexto do usuario logado (ou null se nao autenticado)
export async function getContext(request: Request): Promise<Ctx | null> {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const asUser = createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: { user }, error } = await asUser.auth.getUser();
  if (error || !user) return null;

  const a = admin();
  const { data } = await a
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", user.id)
    .single();
  const plan = (data?.plan as Plan) ?? "free";
  const exp = data?.plan_expires_at ?? null;
  return { userId: user.id, email: user.email, plan, exp, paid: isPaid(plan, exp), admin: a };
}

// confirma que o usuario logado e admin (is_admin = true). Senao, null.
export async function getAdmin(request: Request): Promise<Ctx | null> {
  const ctx = await getContext(request);
  if (!ctx) return null;
  const { data } = await ctx.admin.from("profiles").select("is_admin").eq("id", ctx.userId).single();
  return data?.is_admin ? ctx : null;
}
