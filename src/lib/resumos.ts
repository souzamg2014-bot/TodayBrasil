// Resumos Inteligentes: temas (5) e janelas de tempo (2: manha|tarde). Fonte unica
// usada no front (/resumos) e nos scripts de geracao. As janelas sao INTERNAS: o
// site nao expoe seletor de janela, so exibe o resumo pronto rotulado Manha/Tarde.

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
  { id: "manha", label: "Manhã", faixa: "0h–12h", start: 0, end: 12 },
  { id: "tarde", label: "Tarde", faixa: "12h–24h", start: 12, end: 24 },
];

const TEMA_BY = new Map(TEMAS.map((t) => [t.id, t]));
const JANELA_BY = new Map(JANELAS.map((j) => [j.id, j]));

export const getTema = (id: string) => TEMA_BY.get(id);
export const getJanela = (id: string) => JANELA_BY.get(id);
