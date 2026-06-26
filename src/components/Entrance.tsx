"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Tela de entrada: porta (logo + slogan + ENTRAR) -> abre -> login.
// Ao autenticar, o onAuthStateChange no page.tsx troca pro feed.
export default function Entrance() {
  const [view, setView] = useState<"door" | "opening" | "login">("door");
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const openDoor = () => {
    setView("opening");
    setTimeout(() => setView("login"), 900); // dura o mesmo da animacao CSS
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        });
        if (error) throw error;
        setMsg("Se o e-mail existir, enviamos um link para redefinir a senha.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        if (!data.session) setMsg("Conta criada. Confirme seu e-mail para entrar.");
        // se a confirmacao estiver desligada, ja vem sessao e o page troca pro feed
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? traduz(e.message) : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="entrance">
      {/* PORTA (sempre montada p/ animar; some quando vira login) */}
      {view !== "login" && (
        <div className={`door ${view === "opening" ? "opening" : ""}`}>
          <div className="door-panel left" />
          <div className="door-panel right" />
          <div className="seam" />
          <div className="door-content">
            <h1 className="masthead">
              Today<em>Brasil</em>
            </h1>
            <p className="slogan">Sua fonte de notícias</p>
            <button className="enterbtn" onClick={openDoor} aria-label="Entrar">
              <span className="doorico" aria-hidden>⇥</span> ENTRAR
            </button>
          </div>
        </div>
      )}

      {/* LOGIN */}
      {view === "login" && (
        <div className="loginwrap">
          <button className="back" onClick={() => { setView("door"); setErr(null); setMsg(null); }}>
            ← VOLTAR
          </button>
          <form className="loginbox" onSubmit={submit}>
            <div className="logomini">
              Today<em>Brasil</em>
            </div>
            <p className="loginsub">
              {mode === "login" ? "ACESSE SUA CONTA" : mode === "signup" ? "CRIAR CONTA" : "REDEFINIR SENHA"}
            </p>

            <label className="fld">
              <span>E-MAIL</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {mode !== "reset" && (
              <label className="fld">
                <span>SENHA</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
              </label>
            )}

            {err && <p className="formerr">{err}</p>}
            {msg && <p className="formok">{msg}</p>}

            <button className="loginbtn" type="submit" disabled={busy}>
              {busy ? "..." : mode === "login" ? "ENTRAR" : mode === "signup" ? "CRIAR CONTA" : "ENVIAR LINK"}
            </button>

            <div className="loginlinks">
              {mode === "login" ? (
                <>
                  <button type="button" onClick={() => { setMode("reset"); setErr(null); setMsg(null); }}>
                    Esqueci a senha
                  </button>
                  <button type="button" onClick={() => { setMode("signup"); setErr(null); setMsg(null); }}>
                    Criar conta
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => { setMode("login"); setErr(null); setMsg(null); }}>
                  Já tenho conta
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function traduz(m: string): string {
  const s = m.toLowerCase();
  if (s.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (s.includes("already registered")) return "Esse e-mail já tem conta. Faça login.";
  if (s.includes("password should")) return "A senha precisa de ao menos 6 caracteres.";
  if (s.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  return m;
}
