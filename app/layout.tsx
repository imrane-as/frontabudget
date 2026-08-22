import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FrontaBudget",
  description: "Budget et suivi financier pour frontaliers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
