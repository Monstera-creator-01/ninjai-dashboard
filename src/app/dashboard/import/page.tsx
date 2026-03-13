import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { CsvUploadZoneWithRefresh } from "@/components/csv-upload-zone-with-refresh";
import { UploadHistoryTable } from "@/components/upload-history-table";

export default async function ImportPage() {
  const supabase = await createClient();

  const { data: history } = await supabase
    .from("upload_history")
    .select("*, profiles(full_name)")
    .order("uploaded_at", { ascending: false })
    .limit(50);

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">Data Import</h1>
      </header>

      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Import Data</h2>
          <p className="text-muted-foreground">
            Upload Heyreach CSV exports to populate your campaign dashboard.
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          <CsvUploadZoneWithRefresh />
          <UploadHistoryTable rows={history ?? []} />
        </div>
      </div>
    </>
  );
}
