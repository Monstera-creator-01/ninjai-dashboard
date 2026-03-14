"use client";

import Link from "next/link";
import { useAMWorkspaceDetail } from "@/hooks/use-am-workspace-detail";
import { AMKPISection } from "@/components/am-kpi-section";
import { AMNotableConversations } from "@/components/am-notable-conversations";
import { AMEmergingRisks } from "@/components/am-emerging-risks";
import { AMTalkingPoints } from "@/components/am-talking-points";
import { AMCopyButton } from "@/components/am-copy-button";
import { AMDetailLoading } from "@/components/am-summary-loading";
import { AMSummaryError } from "@/components/am-summary-error";
import { HealthBadge } from "@/components/health-badge";
import { ActivityIndicator } from "@/components/activity-indicator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface AMWorkspaceDetailProps {
  workspace: string;
}

export function AMWorkspaceDetail({ workspace }: AMWorkspaceDetailProps) {
  const {
    data,
    isLoading,
    error,
    refetch,
    talkingPoints,
    saveStatus,
    updateUserNotes,
    loadWeek,
    selectedWeek,
  } = useAMWorkspaceDetail(workspace);

  // Loading state
  if (isLoading) {
    return <AMDetailLoading />;
  }

  // Error state
  if (error) {
    return <AMSummaryError message={error} onRetry={refetch} />;
  }

  // No data
  if (!data) {
    return (
      <AMSummaryError
        message="Keine Daten fuer diesen Workspace gefunden."
        onRetry={refetch}
      />
    );
  }

  const dateRangeLabel = data.dateRange
    ? `${new Date(data.dateRange.start).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      })} - ${new Date(data.dateRange.end).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}`
    : "Letzte 7 Tage";

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
            <BreadcrumbPage>{data.workspace}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Detail Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight">
              {data.workspace}
            </h2>
            <HealthBadge status={data.healthStatus} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ActivityIndicator
              level={data.activityLevel}
              lastActiveDate={data.lastActiveDate}
            />
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="outline" className="gap-1 text-xs">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {dateRangeLabel}
            </Badge>
          </div>
        </div>
        <AMCopyButton data={data} userNotes={talkingPoints?.userNotes ?? ""} />
      </div>

      <Separator />

      {/* KPIs & Trends */}
      <AMKPISection kpis={data.kpis} />

      <Separator />

      {/* Notable Conversations */}
      <AMNotableConversations
        conversations={data.notableConversations}
        workspace={data.workspace}
      />

      <Separator />

      {/* Emerging Risks */}
      <AMEmergingRisks risks={data.risks} />

      <Separator />

      {/* Talking Points */}
      <AMTalkingPoints
        talkingPoints={talkingPoints}
        weekArchive={data.weekArchive}
        selectedWeek={selectedWeek}
        saveStatus={saveStatus}
        onNotesChange={updateUserNotes}
        onWeekChange={loadWeek}
      />
    </div>
  );
}
