import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choirmaster",
  description: "Choirmaster dashboard",
  icons: {
    icon: "/Choirmaster%20Icon%20Transparent.svg"
  }
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
