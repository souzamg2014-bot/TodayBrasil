"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SECTORS } from "@/lib/sectors";
import { THEMES } from "@/lib/themes";

type Rule = {
  id: string; kind: "keyword" | "sector" | "lente"; value: string;
  label: string | null; channels: string[]; active: boolean; created_at: string;
};
type Notif = {
  id: string; kind: string | null; value: string | null;
  title: string; body: string | null; url: string | null;
  read_at: string | null; created_at: string;
};

const KIND_LABEL: Record<string, string> = { keyword: "Palavra-chave", sector: "Setor", lente: "Lente" };
const SECTOR_LABEL = new Map(SECTORS.map((s) => [s.id, s.label]));
const THEME_LABEL = new Map(THEMES.map((t) => [t.id, t.label]));

function ruleText(r: Rule) {
  if (r.kind === "sector") return SECTOR_LABEL.get(r.value) ?? r.value;
  if (r.kind === "lente") return THEME_LABEL.get(r.value) ?? r.value;
  return r.label || r.value; // keyword: mostra o texto original digitado
}
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} d`;
}

// VAPID: converte a chave publica base64url em Uint8Array p/ o pushManager
function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function Alertas() {
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "anon">("loading");
  const [rules, setRules] = useState<Rule[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  // form de nova regra
  const [kind, setKind] = useState<"keyword" | "sector" | "lente">("keyword");
  const [value, setValue] = useState("");
  const [pushChannel, setPushChannel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // web push
  const [pushAvail, setPushAvail] = useState(false);
  const [pushOn, setPushOn] = useState(false);

  const token = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const load = useCallback(async () => {
    const t = await token();
    if (!t) { setState("anon"); return; }
    const h = { Authorization: `Bearer ${t}` };
    const [rr, nr] = await Promise.all([
      fetch("/api/alerts", { headers: h }),
      fetch("/api/notifications", { headers: h }),
    ]);
    if (rr.status === 403) { setState("forbidden"); return; }
    const rd = await rr.json();
    const nd = await nr.json();
    setRules(rd.rules ?? []);
    setNotifs(nd.items ?? []);
    setUnread(nd.unread ?? 0);
    setState("ok");
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // checa suporte a web push + se ja esta inscrito
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setPushAvail(true);
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setPushOn(!!sub);
    });
  }, []);

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const v = value.trim();
    if (!v) return;
    setBusy(true);
    const t = await token();
    const channels = ["in_app", ...(pushChannel ? ["push"] : [])];
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ kind, value: v, channels }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error ?? "erro ao salvar"); return; }
    setValue("");
    load();
  }

  async function delRule(id: string) {
    const t = await token();
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
    setRules((rs) => rs.filter((r) => r.id !== id));
  }

  async function markRead(id?: string) {
    const t = await token();
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    setNotifs((ns) => ns.map((n) => (!id || n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnread((u) => (id ? Math.max(0, u - 1) : 0));
  }

  async function togglePush() {
    setErr("");
    const t = await token();
    if (pushOn) {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPushOn(false);
      return;
    }
    // ativar
    const keyRes = await fetch("/api/push", { headers: { Authorization: `Bearer ${t}` } });
    if (!keyRes.ok) { setErr("Push ainda não configurado no servidor."); return; }
    const { publicKey } = await keyRes.json();
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { setErr("Permissão de notificação negada."); return; }
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const res = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    if (res.ok) setPushOn(true);
    else setErr("Não foi possível salvar a inscrição.");
  }

  if (state === "loading") return <div className="cadwrap"><p className="hint">Carregando...</p></div>;
  if (state === "anon") return <div className="cadwrap"><p>Faça login.</p><a className="hint" href="/">← início</a></div>;
  if (state === "forbidden")
    return (
      <div className="cadwrap caddenied">
        <a href="/"><span className="cadminilogo">Today<em>Brasil</em></span></a>
        <h1 className="cadlogo">Central de <em>Alertas</em></h1>
        <p>Recurso dos planos pagos: monitore palavras-chave, setores e lentes, e seja avisado quando entrar uma notícia que casa, na central e por push.</p>
        <a className="abtn" href="/">← Voltar ao feed</a>
      </div>
    );

  return (
    <div className="cadwrap">
      <header className="cadhead">
        <a href="/"><span className="cadminilogo">Today<em>Brasil</em></span></a>
        <a className="hint" href="/">← feed</a>
      </header>
      <h1 className="cadlogo">Central de <em>Alertas</em></h1>
      <p className="cadsub">Monitore o que importa e receba na central e no navegador (push).</p>

      {/* ---- configurar regras ---- */}
      <section style={{ marginTop: 24 }}>
        <h2 className="alsec">Meus monitores</h2>
        <form onSubmit={addRule} className="alform">
          <select value={kind} onChange={(e) => { setKind(e.target.value as typeof kind); setValue(""); }} className="alinput">
            <option value="keyword">Palavra-chave</option>
            <option value="sector">Setor</option>
            <option value="lente">Lente</option>
          </select>
          {kind === "keyword" && (
            <input className="alinput" placeholder="ex.: Petrobras, tarifa aço..." value={value}
              onChange={(e) => setValue(e.target.value)} maxLength={120} />
          )}
          {kind === "sector" && (
            <select className="alinput" value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">Escolha o setor...</option>
              {SECTORS.filter((s) => s.id !== "geral").map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          )}
          {kind === "lente" && (
            <select className="alinput" value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">Escolha a lente...</option>
              {THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          )}
          <label className="alcheck">
            <input type="checkbox" checked={pushChannel} onChange={(e) => setPushChannel(e.target.checked)} /> push
          </label>
          <button className="abtn" disabled={busy || !value.trim()}>{busy ? "..." : "Adicionar"}</button>
        </form>
        {err && <p className="hint" style={{ color: "crimson" }}>{err}</p>}

        {rules.length === 0 ? (
          <p className="hint">Nenhum monitor ainda. Adicione palavras-chave, setores ou lentes acima.</p>
        ) : (
          <ul className="allist">
            {rules.map((r) => (
              <li key={r.id} className="alrule">
                <span className="alkind">{KIND_LABEL[r.kind]}</span>
                <span className="alval">{ruleText(r)}</span>
                {r.channels.includes("push") && <span className="albadge">push</span>}
                <button className="aldel" onClick={() => delRule(r.id)} title="remover">×</button>
              </li>
            ))}
          </ul>
        )}

        {pushAvail && (
          <button className="alpush" onClick={togglePush}>
            {pushOn ? "🔔 Push ativo neste navegador (desativar)" : "🔕 Ativar push neste navegador"}
          </button>
        )}
      </section>

      {/* ---- notificacoes ---- */}
      <section style={{ marginTop: 36 }}>
        <div className="alnothead">
          <h2 className="alsec">Notificações {unread > 0 && <span className="alunread">{unread}</span>}</h2>
          {unread > 0 && <button className="hint albtnlink" onClick={() => markRead()}>marcar todas como lidas</button>}
        </div>
        {notifs.length === 0 ? (
          <p className="hint">Sem notificações ainda. Quando entrar uma notícia que casa com seus monitores, ela aparece aqui.</p>
        ) : (
          <ul className="allist">
            {notifs.map((n) => (
              <li key={n.id} className={`alnotif ${n.read_at ? "" : "alnew"}`} onClick={() => !n.read_at && markRead(n.id)}>
                <div className="alnmeta">
                  {n.kind && <span className="alkind">{KIND_LABEL[n.kind] ?? n.kind}: {n.kind === "sector" ? (SECTOR_LABEL.get(n.value ?? "") ?? n.value) : n.kind === "lente" ? (THEME_LABEL.get(n.value ?? "") ?? n.value) : n.value}</span>}
                  <span className="alntime">{timeAgo(n.created_at)}</span>
                </div>
                <a className="alntitle" href={n.url ?? "#"} target="_blank" rel="noopener noreferrer">{n.title}</a>
                {n.body && <p className="alnbody">{n.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
