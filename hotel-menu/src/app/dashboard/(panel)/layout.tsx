import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { QueryProvider } from "@/components/QueryProvider";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <DashboardShell>{children}</DashboardShell>
    </QueryProvider>
  );
}
