import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CampaignSnapshot } from "@/components/campaign-snapshot";

export default function DashboardPage() {
  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">Campaign Intelligence</h1>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Campaign Snapshot
          </h2>
          <p className="text-muted-foreground">
            Overview of all workspace performance for the last 7 days.
          </p>
        </div>

        <CampaignSnapshot />
      </main>
    </>
  );
}
