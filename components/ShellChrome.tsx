"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import EnsembleOnboardingFlow from "@/components/EnsembleOnboardingFlow";
import PageHeader from "@/components/PageHeader";
import SidebarNav from "@/components/SidebarNav";
import { getPageTitle } from "@/components/navItems";
import { useAppData } from "@/hooks/useAppData";

export default function ShellChrome({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const { allProjects, allPeople } = useAppData();
  const title = getPageTitle(pathname, {
    projects: allProjects,
    people: allPeople
  });
  const [showEnsembleFlow, setShowEnsembleFlow] = useState(false);

  useEffect(() => {
    const handleOpenCreateChoir = () => {
      setShowEnsembleFlow(true);
    };
    window.addEventListener("choirmaster:create-choir", handleOpenCreateChoir);
    return () => {
      window.removeEventListener("choirmaster:create-choir", handleOpenCreateChoir);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="md:flex">
        <SidebarNav currentPath={pathname} />
        <div className="flex-1 min-w-0">
          <PageHeader
            title={title}
            currentPath={pathname}
            onCreateChoir={() => setShowEnsembleFlow(true)}
          />
          <main className="min-w-0 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 md:px-8 md:pb-10">
            {children}
          </main>
        </div>
      </div>
      <BottomNav currentPath={pathname} />
      <EnsembleOnboardingFlow
        open={showEnsembleFlow}
        onClose={() => setShowEnsembleFlow(false)}
      />
    </div>
  );
}
