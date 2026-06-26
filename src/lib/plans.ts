// Planos e regras do paywall (fonte unica). Usado no front e na API.

export type Plan = "free" | "pro" | "caderno";

export const PLANS = {
  free: { label: "Grátis", price: 0 },
  pro: { label: "Pro", price: 9.9 },
  caderno: { label: "Caderno Inteligente", price: 29.9 }, // inclui Pro
} as const;

// quantas noticias o plano free ve antes do paywall
export const FREE_LIMIT = 20;

// assinatura ativa? (pro ou caderno, dentro da validade)
export function isPaid(plan?: Plan | null, expiresAt?: string | null): boolean {
  if (plan !== "pro" && plan !== "caderno") return false;
  if (!expiresAt) return true; // sem data = ativo
  return new Date(expiresAt).getTime() > Date.now();
}

// caderno inteligente (IA) - so no plano caderno
export function hasCaderno(plan?: Plan | null, expiresAt?: string | null): boolean {
  return plan === "caderno" && isPaid(plan, expiresAt);
}

// o que o plano libera
export function canSearch(plan?: Plan | null, exp?: string | null) { return isPaid(plan, exp); }
export function canLoadMore(plan?: Plan | null, exp?: string | null) { return isPaid(plan, exp); }
export function feedLimit(plan?: Plan | null, exp?: string | null) {
  return isPaid(plan, exp) ? null : FREE_LIMIT; // null = sem limite
}
