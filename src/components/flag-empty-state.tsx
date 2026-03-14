"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Upload } from "lucide-react";

interface FlagEmptyStateProps {
  hasData: boolean;
  allDisabled?: boolean;
}

export function FlagEmptyState({
  hasData,
  allDisabled = false,
}: FlagEmptyStateProps) {
  if (allDisabled) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CheckCircle2
                className="h-6 w-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <CardTitle>All Flags Disabled</CardTitle>
            <CardDescription>
              All flag types are currently disabled in settings. Enable flag
              types to start monitoring campaign health.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/interventions/settings">
                Go to Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload
                className="h-6 w-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <CardTitle>No Data Uploaded Yet</CardTitle>
            <CardDescription>
              Upload your Heyreach CSV exports to start generating intervention
              flags. Flags are evaluated automatically after each import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/import">
                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                Import CSV Data
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2
              className="h-6 w-6 text-emerald-600"
              aria-hidden="true"
            />
          </div>
          <CardTitle>All Clear!</CardTitle>
          <CardDescription>
            No active intervention flags. All campaigns are performing within
            acceptable thresholds.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
