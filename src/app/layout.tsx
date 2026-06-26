import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

// Masthead de jornal classico (Didone, alto contraste)
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TodayBrasil",
  description: "Sua fonte de notícias.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={playfair.variable}>
      <body>{children}</body>
    </html>
  );
}
