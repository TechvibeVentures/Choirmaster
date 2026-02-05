import ShellChrome from "@/components/ShellChrome";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return <ShellChrome>{children}</ShellChrome>;
}
