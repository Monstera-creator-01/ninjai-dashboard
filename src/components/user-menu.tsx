"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { InviteUserDialog } from "@/components/invite-user-dialog";
import { ChevronsUpDown, LogOut, UserPlus } from "lucide-react";
import { ROLE_LABELS, type UserProfile } from "@/lib/types";

interface UserMenuProps {
  profile: UserProfile | null;
  userEmail: string | null;
}

export function UserMenu({ profile, userEmail }: UserMenuProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const displayName =
    profile?.full_name || userEmail?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isTeamLead = profile?.role === "team_lead";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  {profile?.role && (
                    <span className="truncate text-xs text-muted-foreground">
                      {ROLE_LABELS[profile.role]}
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              align="start"
              side="top"
              sideOffset={8}
            >
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {userEmail}
                </span>
                {profile?.role && (
                  <Badge variant="secondary" className="mt-1 w-fit text-xs">
                    {ROLE_LABELS[profile.role]}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isTeamLead && (
                <>
                  <DropdownMenuItem
                    onClick={() => setInviteOpen(true)}
                    className="cursor-pointer"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}
