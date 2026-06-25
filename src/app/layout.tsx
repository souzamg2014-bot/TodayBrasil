import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TodayBrasil — o que está acontecendo agora",
  description:
    "Feed que compila notícias da web e filtra por setor, palavra-chave e contexto. Grátis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
