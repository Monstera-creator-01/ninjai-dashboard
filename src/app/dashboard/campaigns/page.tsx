import { redirect } from "next/navigation";

// The campaigns index redirects to the main dashboard,
// which is the Campaign Intelligence Snapshot view.
// Individual workspace details are at /dashboard/campaigns/[workspace].
export default function CampaignsIndexPage() {
  redirect("/dashboard");
}
