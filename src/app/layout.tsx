import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ninjai Dashboard",
  description: "Campaign intelligence dashboard for Ninja Marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
