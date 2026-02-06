import type { LucideIcon } from "lucide-react";
import { FolderKanban, Home, MessageCircle, Music2, Users } from "lucide-react";
import { getPersonName, people, projects } from "@/lib/mockData";
import { strings } from "@/lib/i18n";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  mobileLabel?: string;
};

export const navItems: NavItem[] = [
  { label: strings.nav.dashboard, href: "/dashboard", icon: Home },
  { label: strings.nav.projects, href: "/projects", icon: FolderKanban },
  { label: strings.nav.repertoire, href: "/sheets", icon: Music2 },
  { label: strings.nav.singers, href: "/singers", icon: Users },
  {
    label: strings.nav.messages,
    href: "/messages",
    icon: MessageCircle
  }
];

export const getPageTitle = (pathname: string) => {
  if (!pathname) return strings.nav.dashboard;
  if (pathname === "/projects/overview") {
    return strings.projects.overviewTitle;
  }
  if (pathname === "/projects") {
    return strings.nav.projects;
  }
  if (pathname.startsWith("/projects/")) {
    const projectId = pathname.split("/")[2];
    const project = projects.find((item) => item.id === projectId);
    return project?.name ?? strings.nav.projects;
  }
  if (pathname === "/singers/onboarding") {
    return strings.onboarding.title;
  }
  if (pathname.startsWith("/singers/")) {
    const personId = pathname.split("/")[2];
    const person = people.find((item) => item.id === personId);
    return person ? getPersonName(person) : strings.nav.singers;
  }
  if (pathname === "/admin-profile") {
    return strings.profile.title;
  }
  const match = navItems.find((item) => item.href === pathname);
  return match?.label ?? strings.nav.dashboard;
};
