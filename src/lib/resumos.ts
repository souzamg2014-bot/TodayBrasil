// Resumos Inteligentes: temas (5) e janelas de tempo (3). Fonte unica usada no
// front (/resumos) e nos scripts de geracao. Absorve os antigos temas do caderno.

export type Tema = { id: string; label: string };

export const TEMAS: Tema[] = [
  { id: "ma", label: "M&A" },
  { id: "startup", label: "Startups" },
  { id: "inovacao", label: "Inovação & IA" },
  { id: "industria", label: "Indústria" },
  { id: "politica", label: "Política & Regulação" },
];

// Janelas que cobrem as 24h. start/end em horas locais (BRT).
// 'manha' atravessa a meia-noite (18:00 do dia anterior -> 07:00).
export type Janela = {
  id: string;
  label: string;
  faixa: string; // rotulo curto p/ exibir
  start: number; // hora de inicio (0-23)
  end: number;   // hora de fim (0-23)
};

export const JANELAS: Janela[] = [
  { id: "manha", label: "Manhã", faixa: "18h–7h", start: 18, end: 7 },
  { id: "tarde", label: "Tarde", faixa: "7h–13h", start: 7, end: 13 },
  { id: "noite", label: "Noite", faixa: "13h–18h", start: 13, end: 18 },
];

const TEMA_BY = new Map(TEMAS.map((t) => [t.id, t]));
const JANELA_BY = new Map(JANELAS.map((j) => [j.id, j]));

export const getTema = (id: string) => TEMA_BY.get(id);
export const getJanela = (id: string) => JANELA_BY.get(id);
