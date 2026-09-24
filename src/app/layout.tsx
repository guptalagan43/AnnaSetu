import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AnnaSetu — Real-Time Food Rescue Platform",
  description: "Connecting surplus food from businesses to shelters in minutes. Zero waste, zero friction, zero hunger.",
  keywords: ["food rescue", "food donation", "surplus food", "NGO", "shelter", "food waste", "social impact"],
  authors: [{ name: "AnnaSetu Team" }],
  creator: "AnnaSetu",
  publisher: "AnnaSetu",
  robots: "index, follow",
  openGraph: {
    title: "AnnaSetu — Real-Time Food Rescue Platform",
    description: "Connecting surplus food from businesses to shelters in minutes.",
    type: "website",
    siteName: "AnnaSetu",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-brand-white text-brand-black font-body">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 btn-primary">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}