// Resumos Inteligentes (produto de inteligência / clipping "sob consulta").
// Um resumo agregado por SETOR de negócio, cobrindo o dia inteiro. Fonte única
// usada no front (/resumos) e nos scripts de geração.
//
// Deixamos de usar janelas de tempo (manhã/tarde): agora é um panorama por setor,
// do dia. O campo `janela` no banco recebe um valor fixo ('geral') só para manter
// a unicidade por (tema, janela, data_ref).

export type Tema = {
  id: string;      // id do resumo (= "tema"/setor)
  label: string;   // rótulo exibido
  sector?: string; // setor da taxonomia (src/lib/sectors.ts) de onde vem o material
  lens?: string;   // OU lente/tema (src/lib/themes.ts), ex.: M&A
};

// Setores de negócio + M&A. Ordem = ordem de exibição.
export const TEMAS: Tema[] = [
  { id: "ma",         label: "M&A",                    lens: "ma" },
  { id: "agro",       label: "Agronegócio",            sector: "agronegocio" },
  { id: "comercio",   label: "Comércio e Varejo",      sector: "comercio-varejista" },
  { id: "industria",  label: "Indústria",              sector: "industria" },
  { id: "tecnologia", label: "Tecnologia",             sector: "tecnologia-software" },
  { id: "telecom",    label: "Telecom",                sector: "telecomunicacoes" },
  { id: "financeiro", label: "Financeiro",             sector: "servicos-financeiros" },
  { id: "transporte", label: "Transporte e Logística", sector: "transporte-logistica" },
  { id: "energia",    label: "Energia",                sector: "energia-recursos" },
  { id: "saude",      label: "Saúde",                  sector: "saude-bem-estar" },
  { id: "construcao", label: "Construção e Imobiliário", sector: "construcao-imobiliario" },
];

// valor fixo do campo `janela` no banco (janelas de tempo foram removidas).
export const JANELA_GERAL = "geral";

const TEMA_BY = new Map(TEMAS.map((t) => [t.id, t]));
export const getTema = (id: string) => TEMA_BY.get(id);
