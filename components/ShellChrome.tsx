"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import SidebarNav from "@/components/SidebarNav";
import { getPageTitle } from "@/components/navItems";

export default function ShellChrome({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const title = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="md:flex">
        <SidebarNav currentPath={pathname} />
        <div className="flex-1 min-w-0">
          <PageHeader title={title} currentPath={pathname} />
          <main className="min-w-0 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 md:px-8 md:pb-10">
            {children}
          </main>
        </div>
      </div>
      <BottomNav currentPath={pathname} />
    </div>
  );
}
