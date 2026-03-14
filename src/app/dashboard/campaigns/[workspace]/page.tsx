"use client";

import { use } from "react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WorkspaceDetailView } from "@/components/workspace-detail-view";

interface WorkspaceDetailPageProps {
  params: Promise<{ workspace: string }>;
}

export default function WorkspaceDetailPage({
  params,
}: WorkspaceDetailPageProps) {
  const { workspace } = use(params);
  const decodedWorkspace = decodeURIComponent(workspace);

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to Snapshot</span>
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium truncate">{decodedWorkspace}</h1>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <WorkspaceDetailView workspace={decodedWorkspace} />
      </main>
    </>
  );
}
