"use client";

import { use } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AMWorkspaceDetail } from "@/components/am-workspace-detail";

interface AMWorkspaceDetailPageProps {
  params: Promise<{ workspace: string }>;
}

export default function AMWorkspaceDetailPage({
  params,
}: AMWorkspaceDetailPageProps) {
  const { workspace } = use(params);
  const decodedWorkspace = decodeURIComponent(workspace);

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">AM Summary</h1>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <AMWorkspaceDetail workspace={decodedWorkspace} />
      </main>
    </>
  );
}
