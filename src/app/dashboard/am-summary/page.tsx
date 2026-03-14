import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AMSummary } from "@/components/am-summary";

export default function AMSummaryPage() {
  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">AM Summary</h1>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Account Manager Summary
          </h2>
          <p className="text-muted-foreground">
            Workspace-Performance, Notable Conversations und Talking Points fuer
            die Client-Call Vorbereitung.
          </p>
        </div>

        <AMSummary />
      </main>
    </>
  );
}
