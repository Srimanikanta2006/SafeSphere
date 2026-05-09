import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SirenAlarm from "@/components/SirenAlarm";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "SafeCity AI | Public Safety Intelligence Platform",
  description: "AI-powered real-time public safety intelligence platform for women safety, crash detection, and road hazard reporting.",
  manifest: "/manifest.json",
  themeColor: "#4F6EF7",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-slate-50 text-slate-900">
        {children}
        <SirenAlarm />
      </body>
    </html>
  );
}
