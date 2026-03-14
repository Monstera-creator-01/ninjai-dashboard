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
import { Upload, BarChart3 } from "lucide-react";

export function SnapshotEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <CardTitle>No Campaign Data Yet</CardTitle>
          <CardDescription>
            Upload your Heyreach CSV exports to see campaign intelligence
            metrics, health indicators, and performance trends.
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
