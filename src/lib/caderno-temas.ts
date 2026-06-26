// Temas do Caderno Exclusivo (guia das materias). Baseado nas lentes, ajustado.
export type CadernoTema = { id: string; label: string; emoji: string };

export const CADERNO_TEMAS: CadernoTema[] = [
  { id: "ma", label: "M&A", emoji: "🤝" },
  { id: "startup", label: "Startups", emoji: "🚀" },
  { id: "inovacao", label: "Inovação & IA", emoji: "💡" },
  { id: "industria", label: "Indústria", emoji: "🏭" },
  { id: "politica", label: "Política & Regulação", emoji: "🏛️" },
];

const BY = new Map(CADERNO_TEMAS.map((t) => [t.id, t]));
export const getTema = (id: string) => BY.get(id);
