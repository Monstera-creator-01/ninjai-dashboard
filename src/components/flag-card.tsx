"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Eye,
  X,
  ExternalLink,
  Calendar,
  TrendingDown,
  Target,
} from "lucide-react";
import type { Flag } from "@/lib/types/flags";
import { FLAG_TYPE_LABELS } from "@/lib/types/flags";

interface FlagCardProps {
  flag: Flag;
  onAcknowledge: (flag: Flag) => void;
  onDismiss: (flagId: string) => void;
  isSubmitting: boolean;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export function FlagCard({
  flag,
  onAcknowledge,
  onDismiss,
  isSubmitting,
}: FlagCardProps) {
  const isAcknowledged = flag.status === "acknowledged";

  return (
    <Card
      className={cn(
        "transition-colors",
        isAcknowledged && "border-blue-200 bg-blue-50/30"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{flag.workspace}</CardTitle>
              <SeverityBadge severity={flag.severity} />
              {isAcknowledged && (
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100"
                  aria-label="Status: Acknowledged"
                >
                  <Eye className="mr-1 h-3 w-3" aria-hidden="true" />
                  Acknowledged
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium text-foreground">
              {FLAG_TYPE_LABELS[flag.flag_type]}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span
              className="text-xs text-muted-foreground"
              title={formatDate(flag.created_at)}
            >
              {formatRelativeDate(flag.created_at)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Metric details */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <TrendingDown
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">Triggered at:</span>
            <span className="font-semibold text-red-600">
              {flag.triggered_value}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">Threshold:</span>
            <span className="font-semibold">{flag.threshold_value}</span>
          </div>
        </div>

        {/* Acknowledgment note */}
        {isAcknowledged && flag.acknowledgment_note && (
          <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Note:</span>{" "}
              {flag.acknowledgment_note}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/dashboard/campaigns/${encodeURIComponent(flag.workspace)}`}
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              View Campaign
            </Link>
          </Button>

          {!isAcknowledged && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAcknowledge(flag)}
              disabled={isSubmitting}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Acknowledge
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(flag.id)}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
