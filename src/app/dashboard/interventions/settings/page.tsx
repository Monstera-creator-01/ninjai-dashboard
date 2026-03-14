import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ThresholdSettings } from "@/components/threshold-settings";
import { ChevronLeft } from "lucide-react";

export default async function InterventionSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canEdit = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    canEdit = profile?.role === "team_lead";
  }

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">Flag Settings</h1>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/interventions">
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              Back to Interventions
            </Link>
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Flag Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure intervention flag thresholds and enable or disable
            individual flag types.
          </p>
        </div>

        <ThresholdSettings canEdit={canEdit} />
      </main>
    </>
  );
}
