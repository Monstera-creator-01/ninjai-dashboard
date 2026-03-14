import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AMSettings } from "@/components/am-settings";

export default function AMSettingsPage() {
  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">AM Summary - Settings</h1>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Workspace-Zuweisungen
          </h2>
          <p className="text-muted-foreground">
            Weisen Sie Team-Mitgliedern Workspaces zu, damit jeder AM eine
            personalisierte Uebersicht sieht.
          </p>
        </div>

        <AMSettings />
      </main>
    </>
  );
}
