"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmergingRisk, RiskSeverity } from "@/lib/types/am-summary";

interface AMEmergingRisksProps {
  risks: EmergingRisk[];
}

const severityConfig: Record<
  RiskSeverity,
  { label: string; badgeClass: string; iconClass: string; bgClass: string }
> = {
  warning: {
    label: "Warning",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    iconClass: "text-amber-600",
    bgClass: "bg-amber-50 border-amber-200",
  },
  critical: {
    label: "Critical",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    iconClass: "text-red-600",
    bgClass: "bg-red-50 border-red-200",
  },
};

function RiskCard({ risk }: { risk: EmergingRisk }) {
  const config = severityConfig[risk.severity];

  return (
    <Card className={cn("border", config.bgClass)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {risk.severity === "critical" ? (
              <ShieldAlert
                className={cn("h-5 w-5", config.iconClass)}
                aria-hidden="true"
              />
            ) : (
              <AlertTriangle
                className={cn("h-5 w-5", config.iconClass)}
                aria-hidden="true"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge
                variant="outline"
                className={cn("text-xs", config.badgeClass)}
                aria-label={`Severity: ${config.label}`}
              >
                {config.label}
              </Badge>
            </div>
            <p className="text-sm font-medium">{risk.description}</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              <span className="font-medium">Empfehlung:</span>{" "}
              {risk.recommendedAction}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AMEmergingRisks({ risks }: AMEmergingRisksProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Emerging Risks</h3>

      {risks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle
              className="h-8 w-8 text-emerald-500 mx-auto mb-2"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Keine aktuellen Risiken
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Critical risks first, then warnings */}
          {risks
            .sort((a, b) => {
              if (a.severity === "critical" && b.severity !== "critical") return -1;
              if (a.severity !== "critical" && b.severity === "critical") return 1;
              return 0;
            })
            .map((risk) => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
        </div>
      )}
    </div>
  );
}
