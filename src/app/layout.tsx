import type { Metadata } from "next";
import { Newsreader, Space_Grotesk } from "next/font/google";

import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const bodyFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Gold Price Reporter",
  description:
    "A market-data dashboard for live gold pricing, historical context, and spot-linked conversions."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <div className="app-background" />
        <div className="relative min-h-screen">{children}</div>
      </body>
    </html>
  );
}
