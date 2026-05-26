import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Foundry — We give you money to make money",
  description: "Got a good idea and the drive to act on it? We'll back you with real money. You keep a cut of what you make. Apply now — it's free.",
  openGraph: {
    title: "Foundry — We give you money to make money",
    description: "Got a good idea and the drive to act on it? We'll back you with real money. You keep a cut of what you make.",
    url: "https://joinfoundry.io",
    siteName: "Foundry",
    images: [
      {
        url: "https://joinfoundry.io/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foundry — We give you money to make money",
    description: "Got a good idea and the drive to act on it? We'll back you with real money. You keep a cut of what you make.",
  },

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
