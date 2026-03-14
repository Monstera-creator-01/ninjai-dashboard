import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { InterventionFlags } from "@/components/intervention-flags";
import { Settings } from "lucide-react";

export default function InterventionsPage() {
  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">Intervention Flags</h1>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Campaign Interventions
            </h2>
            <p className="text-muted-foreground">
              Monitor flagged campaigns that need attention. Flags are generated
              automatically when metrics drop below configured thresholds.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/interventions/settings">
              <Settings className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Settings
            </Link>
          </Button>
        </div>

        <InterventionFlags />
      </main>
    </>
  );
}
