import type { Metadata } from "next";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";
import "./daylight.css";

export const metadata: Metadata = {
  title: "FrontaBudget",
  description: "Budget, alertes et suivi financier pour frontaliers.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  )
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
