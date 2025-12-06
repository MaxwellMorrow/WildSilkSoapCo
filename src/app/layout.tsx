import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Nunito } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
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
  themeColor: "#D4A574",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${nunito.variable}`}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
