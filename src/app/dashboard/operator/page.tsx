import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { OperatorDashboard } from "@/components/operator-dashboard";

export default function OperatorDashboardPage() {
  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">Operator Dashboard</h1>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Operator Dashboard
          </h2>
          <p className="text-muted-foreground">
            Daily activity overview, sender productivity, and campaign trends at
            a glance.
          </p>
        </div>

        <OperatorDashboard />
      </main>
    </>
  );
}
