import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { MessagingInsight } from "@/components/messaging-insight";

export default function MessagingInsightsPage() {
  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">Messaging Insights</h1>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Messaging Insights
          </h2>
          <p className="text-muted-foreground">
            Browse conversations, analyze reply patterns, and tag responses for
            strategic insights.
          </p>
        </div>

        <MessagingInsight />
      </main>
    </>
  );
}
