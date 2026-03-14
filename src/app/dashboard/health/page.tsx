import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { WeeklyReview } from "@/components/weekly-review";

export default function HealthReviewPage() {
  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">Health Review</h1>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Weekly Campaign Health Review
          </h2>
          <p className="text-muted-foreground">
            Structured weekly analysis with funnel breakdowns, week-over-week
            comparisons, and recommended actions per workspace.
          </p>
        </div>

        <WeeklyReview />
      </main>
    </>
  );
}
