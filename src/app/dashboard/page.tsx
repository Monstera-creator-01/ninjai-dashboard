import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, Upload, Activity, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium">Dashboard</h1>
      </header>

      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome to Ninjai
          </h2>
          <p className="text-muted-foreground">
            Your campaign intelligence dashboard. Get started by importing your
            Heyreach data.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Campaigns
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <CardDescription>Import data to see campaigns</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Data Imports
              </CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <CardDescription>No imports yet</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Health Score
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <CardDescription>Requires campaign data</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Flags
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <CardDescription>No interventions needed</CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to set up your campaign intelligence dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Import your data
                </span>{" "}
                -- Upload Heyreach CSV exports to populate campaign metrics
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Review campaign snapshots
                </span>{" "}
                -- See activity, response rates, and conversation quality at a
                glance
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Monitor health scores
                </span>{" "}
                -- Track weekly trends and catch underperforming campaigns early
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Act on interventions
                </span>{" "}
                -- Respond to automated flags before issues escalate
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
