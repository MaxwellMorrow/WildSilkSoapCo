import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import localFont from "next/font/local";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

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

const charlotteSouthern = localFont({
  src: "../../public/fonts/Charlotte Southern.otf",
  variable: "--font-script",
  display: "swap",
});

const charlotteSouthernSwash = localFont({
  src: "../../public/fonts/Charlotte Southern Swash.otf",
  variable: "--font-charlotte-swash",
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
    <html lang="en" className={`${charlotteSouthern.variable} ${charlotteSouthernSwash.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
