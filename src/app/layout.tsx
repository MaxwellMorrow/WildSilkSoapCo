import type { Metadata, Viewport } from "next";
import { Dancing_Script, Playfair_Display, Inter } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const dancingScript = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Wild Silk Soap Co.",
    template: "%s | Wild Silk Soap Co.",
  },
  description: "Handcrafted artisan soaps made with natural ingredients and love. Shop our collection of luxurious, eco-friendly soaps.",
  keywords: ["handmade soap", "artisan soap", "natural soap", "organic skincare", "eco-friendly"],
  authors: [{ name: "Wild Silk Soap Co." }],
  openGraph: {
    title: "Wild Silk Soap Co.",
    description: "Handcrafted artisan soaps made with natural ingredients and love.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2D3436",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dancingScript.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
