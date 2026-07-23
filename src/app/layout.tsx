import type { Metadata, Viewport } from "next";
import { Unbounded, Manrope } from "next/font/google";
import Script from "next/script";
import { TelegramAuthBridge } from "@/components/TelegramAuthBridge";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "ИИшница — закрытый клуб про ИИ",
  description: "Гайды, курсы, юзкейсы и воркшопы по работе с ИИ",
};

export const viewport: Viewport = {
  themeColor: "#14120f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${unbounded.variable} ${manrope.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-bg text-cream">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <TelegramAuthBridge />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
