import "./globals.css";
import type { Metadata } from "next";
import AppDataProvider from "@/components/providers/AppDataProvider";
import { createEmptyDomainSnapshot, getDomainSnapshot } from "@/lib/data/domainSnapshot";

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
  let snapshot = createEmptyDomainSnapshot("");
  try {
    snapshot = await getDomainSnapshot();
  } catch (error) {
    const digest = (error as { digest?: string } | null)?.digest || "";
    if (digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    console.error("RootLayout getDomainSnapshot error", error);
  }

  return (
    <html lang="de">
      <body className="min-h-screen bg-white">
        <AppDataProvider initialSnapshot={snapshot}>{children}</AppDataProvider>
      </body>
    </html>
  );
}
