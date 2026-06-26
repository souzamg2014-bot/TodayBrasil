// Temas do Caderno Exclusivo (guia das materias). Baseado nas lentes, ajustado.
export type CadernoTema = { id: string; label: string };

export const CADERNO_TEMAS: CadernoTema[] = [
  { id: "ma", label: "M&A" },
  { id: "startup", label: "Startups" },
  { id: "inovacao", label: "Inovação & IA" },
  { id: "industria", label: "Indústria" },
  { id: "politica", label: "Política & Regulação" },
];

const BY = new Map(CADERNO_TEMAS.map((t) => [t.id, t]));
export const getTema = (id: string) => BY.get(id);
