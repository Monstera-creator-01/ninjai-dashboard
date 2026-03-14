"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAMSummary } from "@/hooks/use-am-summary";
import { AMWorkspaceCard } from "@/components/am-workspace-card";
import { AMSummaryLoading } from "@/components/am-summary-loading";
import { AMSummaryError } from "@/components/am-summary-error";
import { AMSummaryEmpty } from "@/components/am-summary-empty";
import { WorkspaceFilter } from "@/components/workspace-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Info } from "lucide-react";

export function AMSummary() {
  const { data, isLoading, error, refetch } = useAMSummary();
  const [workspaceFilter, setWorkspaceFilter] = useState("all");

  // Filter workspaces client-side
  const filteredWorkspaces = useMemo(() => {
    if (!data) return [];
    if (workspaceFilter === "all") return data.workspaces;
    return data.workspaces.filter((ws) => ws.workspace === workspaceFilter);
  }, [data, workspaceFilter]);

  // Get all workspace names for the filter dropdown
  const allWorkspaceNames = useMemo(() => {
    if (!data) return [];
    return data.workspaces.map((ws) => ws.workspace).sort();
  }, [data]);

  // Loading state
  if (isLoading) {
    return <AMSummaryLoading />;
  }

  // Error state
  if (error) {
    return <AMSummaryError message={error} onRetry={refetch} />;
  }

  // Empty state
  if (!data || data.workspaces.length === 0) {
    return <AMSummaryEmpty />;
  }

  return (
    <div className="space-y-6">
      {/* Info banner when no assignments */}
      {!data.hasAssignments && (
        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
          <p className="text-sm text-blue-800">
            Keine Workspace-Zuweisung vorhanden. Alle Workspaces werden angezeigt.
          </p>
          <Button variant="ghost" size="sm" asChild className="ml-auto shrink-0">
            <Link href="/dashboard/am-summary/settings">
              <Settings className="h-4 w-4 mr-1" aria-hidden="true" />
              Zuweisungen verwalten
            </Link>
          </Button>
        </div>
      )}

      {/* Header row with filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <WorkspaceFilter
            workspaces={allWorkspaceNames}
            value={workspaceFilter}
            onChange={setWorkspaceFilter}
          />
          <Badge variant="secondary" className="text-xs">
            {filteredWorkspaces.length} {filteredWorkspaces.length === 1 ? "Workspace" : "Workspaces"}
          </Badge>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/am-summary/settings">
            <Settings className="h-4 w-4 mr-1" aria-hidden="true" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Workspace cards grid */}
      {filteredWorkspaces.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>Keine Workspaces passen zum ausgewaehlten Filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredWorkspaces.map((ws) => (
            <AMWorkspaceCard key={ws.workspace} workspace={ws} />
          ))}
        </div>
      )}
    </div>
  );
}
