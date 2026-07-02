// Contato do produto de inteligência (Resumos Inteligentes / clipping "sob
// consulta"). Fonte única usada na tela de venda (/resumos).
//
// TROQUE pelos dados reais. WHATSAPP: só dígitos com DDI+DDD (ex.: 55 11 9....).
// EMAIL: o e-mail que recebe as consultas.

export const CONTACT = {
  whatsapp: "5511968864653",         // DDI+DDD+numero, só dígitos
  whatsappLabel: "(11) 96886-4653",  // como aparece na tela
  email: "souza.mg2014@gmail.com",   // e-mail de consultas
} as const;

// mensagem pré-preenchida ao abrir o WhatsApp
const WA_MSG = "Olá! Tenho interesse no produto de inteligência (Resumos Inteligentes) do TodayBrasil. Podem me passar os valores?";

export const whatsappLink = (msg: string = WA_MSG) =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`;

export const emailLink = (
  subject = "Interesse no produto de inteligência (TodayBrasil)",
  body = "Olá! Gostaria de saber mais sobre os Resumos Inteligentes e os valores.",
) => `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
