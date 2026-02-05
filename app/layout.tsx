import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choirmaster",
  description: "Choirmaster dashboard"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}
