import Link from "next/link";
import Image from "next/image";
import { navItems } from "@/components/navItems";

const logoSrc = "/Choirmaster%20Logo%20Transparent.svg";

const isActive = (currentPath: string, href: string) =>
  currentPath === href || currentPath.startsWith(`${href}/`);

export default function SidebarNav({
  currentPath
}: {
  currentPath: string;
}) {
  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-slate-200 md:bg-white md:overflow-hidden">
      <div className="px-4 py-6">
        <Image
          src={logoSrc}
          alt="Choirmaster"
          width={240}
          height={90}
          className="h-16 w-full object-contain object-left"
          priority
        />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 pb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(currentPath, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
