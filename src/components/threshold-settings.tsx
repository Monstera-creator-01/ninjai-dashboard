"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/severity-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useFlagThresholds,
  useUpdateThreshold,
} from "@/hooks/use-flag-thresholds";
import type { FlagThreshold } from "@/lib/types/flags";
import { FLAG_TYPE_DESCRIPTIONS } from "@/lib/types/flags";

interface ThresholdRowProps {
  threshold: FlagThreshold;
  canEdit: boolean;
  onSave: (
    id: string,
    updates: { threshold_value?: number; enabled?: boolean }
  ) => void;
  isSaving: boolean;
}

function ThresholdRow({
  threshold,
  canEdit,
  onSave,
  isSaving,
}: ThresholdRowProps) {
  const [value, setValue] = useState(String(threshold.threshold_value));
  const [enabled, setEnabled] = useState(threshold.enabled);
  const [hasChanges, setHasChanges] = useState(false);

  const numericValue = parseFloat(value);
  const isUnrealistic = !isNaN(numericValue) && numericValue === 0;

  function handleValueChange(newValue: string) {
    setValue(newValue);
    const parsed = parseFloat(newValue);
    setHasChanges(
      parsed !== threshold.threshold_value || enabled !== threshold.enabled
    );
  }

  function handleEnabledChange(newEnabled: boolean) {
    setEnabled(newEnabled);
    setHasChanges(
      parseFloat(value) !== threshold.threshold_value ||
        newEnabled !== threshold.enabled
    );
  }

  function handleSave() {
    const updates: { threshold_value?: number; enabled?: boolean } = {};
    const parsed = parseFloat(value);

    if (!isNaN(parsed) && parsed !== threshold.threshold_value) {
      updates.threshold_value = parsed;
    }

    if (enabled !== threshold.enabled) {
      updates.enabled = enabled;
    }

    if (Object.keys(updates).length > 0) {
      onSave(threshold.id, updates);
      setHasChanges(false);
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">{threshold.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {FLAG_TYPE_DESCRIPTIONS[threshold.flag_type]}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <SeverityBadge severity={threshold.severity} />
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {threshold.comparison_period_days} days
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {canEdit ? (
            <Input
              type="number"
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-24 h-8 text-sm"
              step="0.1"
              min="0"
              disabled={isSaving}
              aria-label={`Threshold value for ${threshold.display_name}`}
            />
          ) : (
            <span className="text-sm tabular-nums">
              {threshold.threshold_value}
            </span>
          )}
          {isUnrealistic && canEdit && (
            <span
              className="text-amber-500"
              title="Warning: threshold is set to 0"
            >
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Switch
          checked={enabled}
          onCheckedChange={handleEnabledChange}
          disabled={!canEdit || isSaving}
          aria-label={`${enabled ? "Disable" : "Enable"} ${threshold.display_name}`}
        />
      </TableCell>
      {canEdit && (
        <TableCell>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            aria-label={`Save changes for ${threshold.display_name}`}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Save
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

interface ThresholdSettingsProps {
  canEdit: boolean;
}

export function ThresholdSettings({ canEdit }: ThresholdSettingsProps) {
  const { thresholds, isLoading, error, refetch } = useFlagThresholds();
  const { updateThreshold, isSubmitting } = useUpdateThreshold();
  const { toast } = useToast();

  async function handleSave(
    id: string,
    updates: { threshold_value?: number; enabled?: boolean }
  ) {
    const result = await updateThreshold(id, updates);

    if (result.success) {
      toast({
        title: "Threshold updated",
        description: "The flag threshold has been saved.",
      });
      refetch();
    } else {
      toast({
        title: "Failed to update threshold",
        description: result.error,
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle
                className="h-6 w-6 text-destructive"
                aria-hidden="true"
              />
            </div>
            <CardTitle>Failed to Load Settings</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flag Thresholds</CardTitle>
        <CardDescription>
          {canEdit
            ? "Configure the threshold values and toggle flags on or off. Changes take effect on the next CSV import."
            : "View the current flag threshold configuration. Only team leads can edit these settings."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[250px]">Flag Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Enabled</TableHead>
                {canEdit && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {thresholds.map((threshold) => (
                <ThresholdRow
                  key={threshold.id}
                  threshold={threshold}
                  canEdit={canEdit}
                  onSave={handleSave}
                  isSaving={isSubmitting}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {thresholds.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <p>No threshold configurations found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
