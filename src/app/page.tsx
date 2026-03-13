import { Loader2 } from "lucide-react";

export default function HomePage() {
  // This page is only briefly visible while middleware redirects
  // to /login or /dashboard based on auth state.
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
