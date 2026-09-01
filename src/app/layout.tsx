import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { SiteLoader } from "@/components/layout/SiteLoader";
import { LoadingProvider } from "@/components/layout/LoadingProvider";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GymAdvisor",
  description: "Suivi de coachings sportifs à distance",
  applicationName: "GymAdvisor",
  appleWebApp: {
    capable: true,
    title: "GymAdvisor",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.className} min-h-screen bg-ga-bg text-ga-fg antialiased`}>
        <LoadingProvider>
          <SiteLoader />
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
