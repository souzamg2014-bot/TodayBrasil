"use client";

import { PLANS } from "@/lib/plans";

// Modal minimalista de planos. onChoose(plan) inicia o checkout.
export default function PlansModal({
  onClose,
  onChoose,
}: {
  onClose: () => void;
  onChoose: (plan: "pro" | "caderno") => void;
}) {
  return (
    <div className="modalback" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modalx" onClick={onClose} aria-label="Fechar">×</button>
        <h2 className="modaltitle">Assine o TodayBrasil</h2>
        <p className="modalsub">Sem fidelidade · cancele quando quiser · reembolso em 7 dias.</p>

        <div className="plans">
          {(["pro", "caderno"] as const).map((id) => {
            const p = PLANS[id];
            return (
              <div key={id} className={`plancard ${id === "caderno" ? "hot" : ""}`}>
                {id === "caderno" && <span className="planflag">Completo</span>}
                <h3>{p.label}</h3>
                <div className="price">
                  <span>R$</span>{p.price.toFixed(2).replace(".", ",")}<small>/mês</small>
                </div>
                <p className="plantagline">{"tagline" in p ? p.tagline : ""}</p>
                <ul>
                  {"perks" in p && p.perks.map((x) => <li key={x}>{x}</li>)}
                </ul>
                <button className="planbtn" onClick={() => onChoose(id)}>
                  Assinar {p.label}
                </button>
              </div>
            );
          })}
        </div>

        <p className="modalfine">
          Pagamento via PagBank · Pix, cartão ou boleto · sem multa de cancelamento.
        </p>
      </div>
    </div>
  );
}
