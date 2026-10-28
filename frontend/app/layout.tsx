import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

// Tipografia baseada na referência do Shopify Editions Winter '26: Inter no
// corpo e uma família display (Inter Tight, equivalente livre da Neue
// Montreal) nos títulos. As variáveis alimentam o @theme em globals.css.
const sans = Inter({
  variable: "--fonte-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Inter_Tight({
  variable: "--fonte-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Estoque 3G",
  description: "Sistema de catalogação e endereçamento de estoque",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
