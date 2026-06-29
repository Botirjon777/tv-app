import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
