"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AMSummaryLoading() {
  return (
    <div className="space-y-6" aria-label="Loading AM summary data" role="status">
      {/* Workspace cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="sr-only">Loading AM summary data...</span>
    </div>
  );
}

export function AMDetailLoading() {
  return (
    <div className="space-y-6" aria-label="Loading workspace details" role="status">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notable Conversations skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Card>
          <CardContent className="p-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Risks skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
        </Card>
      </div>

      {/* Talking Points skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>

      <span className="sr-only">Loading workspace detail data...</span>
    </div>
  );
}
