// Planos e regras do paywall (fonte unica). Usado no front e na API.

export type Plan = "free" | "pro" | "caderno";

// id 'caderno' mantido no banco; rotulo de exibicao = "Exclusivo"
export const PLANS = {
  free: { label: "Grátis", price: 0 },
  pro: {
    label: "Pro",
    price: 9.9,
    tagline: "Tudo do TodayBrasil, sem limites.",
    perks: [
      "Feed completo (sem limite de 20)",
      "Busca em tudo",
      "Lentes (M&A, Política, Investimentos...)",
      "Fontes primárias: CVM, falências, CAGED, IBAMA",
      "Notícias do Mundo (EN/ES)",
    ],
  },
  caderno: {
    label: "Exclusivo",
    price: 29.9,
    tagline: "O Pro + nosso Caderno de Inteligência.",
    perks: [
      "Tudo do Pro",
      "Caderno Exclusivo: matérias escritas por nós",
      "Análises de M&A, Startups, Inovação & IA, Indústria e Política",
      "Favoritar, gerar PDF e compartilhar",
    ],
  },
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
