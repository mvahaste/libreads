import BottomNav from "@/components/layout/bottom-nav";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { TRPCReactProvider } from "@/lib/trpc/client";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Libreads",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/images/favicon-light.png",
        href: "/images/favicon-light.png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/images/favicon-dark.png",
        href: "/images/favicon-dark.png",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <TRPCReactProvider>
          <NuqsAdapter>
            <NextIntlClientProvider>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <Header />
                <main className="mx-auto flex w-full max-w-7xl grow flex-col gap-4 p-4">{children}</main>
                <Footer />
                <BottomNav />
                <Toaster />
              </ThemeProvider>
            </NextIntlClientProvider>
          </NuqsAdapter>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
