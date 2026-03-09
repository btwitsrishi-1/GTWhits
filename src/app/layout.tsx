import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CasinoR - Online Gaming",
  description: "Play Mines, Plinko, Roulette, Blackjack and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-casino-bg text-casino-text`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
