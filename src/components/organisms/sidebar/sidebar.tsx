import { AppShell } from "./app-shell";

export function Sidebar({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default Sidebar;
