"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Users,
  ArrowLeft,
} from "lucide-react";
import type { AssignmentsResponse, WorkspaceAssignment } from "@/lib/types/am-summary";

export function AMSettings() {
  const [data, setData] = useState<AssignmentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [localAssignments, setLocalAssignments] = useState<WorkspaceAssignment[]>([]);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/am-summary/assignments");
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load assignments");
      }
      const json: AssignmentsResponse = await response.json();
      setData(json);
      setLocalAssignments(json.assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const toggleWorkspace = (userId: string, workspace: string) => {
    setLocalAssignments((prev) =>
      prev.map((a) => {
        if (a.userId !== userId) return a;
        const has = a.assignedWorkspaces.includes(workspace);
        return {
          ...a,
          assignedWorkspaces: has
            ? a.assignedWorkspaces.filter((w) => w !== workspace)
            : [...a.assignedWorkspaces, workspace],
        };
      })
    );
  };

  const saveAssignment = async (assignment: WorkspaceAssignment) => {
    setSaving(assignment.userId);

    try {
      const response = await fetch("/api/am-summary/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: assignment.userId,
          workspaces: assignment.assignedWorkspaces,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save assignments");
      }

      toast.success(`Zuweisungen fuer ${assignment.fullName || "User"} gespeichert`);
    } catch {
      toast.error("Fehler beim Speichern der Zuweisungen");
    } finally {
      setSaving(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading settings">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <span className="sr-only">Loading settings...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <CardTitle>Fehler beim Laden</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={fetchAssignments}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/am-summary">AM Summary</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Workspace-Zuweisungen</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/am-summary">
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Zurueck
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {localAssignments.length === 0 ? (
        <Card className="text-center">
          <CardContent className="py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Keine Team-Mitglieder gefunden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localAssignments.map((assignment) => (
            <Card key={assignment.userId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {assignment.fullName || "Unbekannter User"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {assignment.email && (
                        <span className="text-xs">{assignment.email}</span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {assignment.role}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveAssignment(assignment)}
                    disabled={saving === assignment.userId}
                    className="gap-1"
                  >
                    {saving === assignment.userId ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        Speichert...
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3" aria-hidden="true" />
                        Speichern
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-3">
                  Zugewiesene Workspaces ({assignment.assignedWorkspaces.length})
                </p>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {data.availableWorkspaces.map((ws) => {
                    const isChecked = assignment.assignedWorkspaces.includes(ws);
                    return (
                      <label
                        key={ws}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() =>
                            toggleWorkspace(assignment.userId, ws)
                          }
                          aria-label={`${ws} zuweisen`}
                        />
                        <span className="truncate">{ws}</span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
