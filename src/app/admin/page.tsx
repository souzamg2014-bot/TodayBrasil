"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type U = {
  id: string;
  email: string | null;
  plan: "free" | "pro" | "caderno";
  plan_expires_at: string | null;
  is_admin: boolean;
  created_at: string;
};

export default function Admin() {
  const [users, setUsers] = useState<U[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "anon">("loading");
  const [busy, setBusy] = useState<string | null>(null);

  async function token() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function load() {
    const t = await token();
    if (!t) { setState("anon"); return; }
    const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${t}` } });
    if (res.status === 403) { setState("forbidden"); return; }
    const data = await res.json();
    setUsers(data.users ?? []);
    setState("ok");
  }

  useEffect(() => { load(); }, []);

  async function apply(id: string, plan: string, months: number) {
    setBusy(id);
    const t = await token();
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id, plan, months }),
    });
    await load();
    setBusy(null);
  }

  if (state === "loading") return <div className="adminwrap"><p className="hint">Carregando...</p></div>;
  if (state === "anon") return <div className="adminwrap"><p>Faça login primeiro.</p></div>;
  if (state === "forbidden") return <div className="adminwrap"><p>Sem acesso.</p></div>;

  const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");
  const ativo = (u: U) => u.plan !== "free" && (!u.plan_expires_at || new Date(u.plan_expires_at) > new Date());

  return (
    <div className="adminwrap">
      <header className="adminhead">
        <h1>Admin · usuários</h1>
        <a href="/" className="hint">← voltar ao feed</a>
      </header>
      <p className="hint">{users.length} usuários</p>
      <table className="atable">
        <thead>
          <tr><th>E-mail</th><th>Plano</th><th>Expira</th><th>Ação</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <Row key={u.id} u={u} ativo={ativo(u)} fmt={fmt} busy={busy === u.id} onApply={apply} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  u, ativo, fmt, busy, onApply,
}: {
  u: U; ativo: boolean; fmt: (s: string | null) => string; busy: boolean;
  onApply: (id: string, plan: string, months: number) => void;
}) {
  const [plan, setPlan] = useState(u.plan);
  const [months, setMonths] = useState(1);
  return (
    <tr>
      <td>{u.email}{u.is_admin && <span className="adminbadge">admin</span>}</td>
      <td>
        <span className={`plantag ${ativo ? "on" : ""}`}>
          {u.plan === "free" ? "Grátis" : "Pro"}
        </span>
      </td>
      <td className="hint">{fmt(u.plan_expires_at)}</td>
      <td>
        <select value={plan} onChange={(e) => setPlan(e.target.value as U["plan"])} className="asel">
          <option value="free">Grátis</option>
          <option value="pro">Pro</option>
        </select>
        {plan !== "free" && (
          <input
            type="number" min={1} max={36} value={months}
            onChange={(e) => setMonths(Number(e.target.value) || 1)}
            className="amonths" title="meses"
          />
        )}
        <button className="abtn" disabled={busy} onClick={() => onApply(u.id, plan, months)}>
          {busy ? "..." : "Aplicar"}
        </button>
      </td>
    </tr>
  );
}
