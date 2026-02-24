"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SingersOnboardingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/singers");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-sm text-slate-500">Weiterleitung...</p>
    </div>
  );
}
