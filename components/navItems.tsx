import { FolderKanban, Home, MessageCircle, Music2, Users } from "lucide-react";
import { getPersonName, people, projects } from "@/lib/mockData";
import { strings } from "@/lib/i18n";

export const navItems = [
  { label: strings.nav.dashboard, href: "/dashboard", icon: Home },
  { label: strings.nav.projects, href: "/projects", icon: FolderKanban },
  { label: strings.nav.repertoire, href: "/repertoire", icon: Music2 },
  { label: strings.nav.people, href: "/people", icon: Users },
  {
    label: strings.nav.communication,
    mobileLabel: "Komm.",
    href: "/communication",
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
  if (pathname.startsWith("/people/")) {
    const personId = pathname.split("/")[2];
    const person = people.find((item) => item.id === personId);
    return person ? getPersonName(person) : strings.nav.people;
  }
  const match = navItems.find((item) => item.href === pathname);
  return match?.label ?? strings.nav.dashboard;
};
