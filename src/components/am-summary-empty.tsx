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
import { Upload, ClipboardList } from "lucide-react";

export function AMSummaryEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <CardTitle>Keine Daten verfuegbar</CardTitle>
          <CardDescription>
            Laden Sie Heyreach CSV-Daten hoch, um die Account Manager
            Zusammenfassung mit Kampagnen-Performance, Notable Conversations und
            Talking Points zu sehen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/import">
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              CSV-Daten importieren
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
