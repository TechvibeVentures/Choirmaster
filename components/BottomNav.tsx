import Link from "next/link";
import { navItems } from "@/components/navItems";

const isActive = (currentPath: string, href: string) =>
  currentPath === href || currentPath.startsWith(`${href}/`);

export default function BottomNav({
  currentPath
}: {
  currentPath: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <nav className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(currentPath, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2 py-3 text-xs ${
                active ? "text-slate-900" : "text-slate-500"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
