import "./globals.css";
import type { Metadata } from "next";
import AppDataProvider from "@/components/providers/AppDataProvider";
import { getDomainSnapshot } from "@/lib/data/domainSnapshot";

export const metadata: Metadata = {
  title: "Choirmaster",
  description: "Choirmaster dashboard",
  icons: {
    icon: "/Choirmaster%20Icon%20Transparent.svg"
  }
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const snapshot = await getDomainSnapshot();

  return (
    <html lang="de">
      <body className="min-h-screen bg-white">
        <AppDataProvider initialSnapshot={snapshot}>{children}</AppDataProvider>
      </body>
    </html>
  );
}
