"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarFlagBadge } from "@/components/sidebar-flag-badge";
import { UserMenu } from "@/components/user-menu";
import type { UserProfile } from "@/lib/types";

interface AppSidebarProps {
  profile: UserProfile | null;
  userEmail: string | null;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Data Import",
    href: "/dashboard/import",
    icon: Upload,
    exact: true,
  },
  {
    title: "Campaigns",
    href: "/dashboard/campaigns",
    icon: BarChart3,
    exact: false,
  },
  {
    title: "Health Review",
    href: "/dashboard/health",
    icon: Activity,
    exact: true,
  },
  {
    title: "Interventions",
    href: "/dashboard/interventions",
    icon: AlertTriangle,
    exact: false,
  },
];

export function AppSidebar({ profile, userEmail }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">N</span>
          </div>
          <span className="text-lg font-semibold">Ninjai</span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href)
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.title === "Interventions" && <SidebarFlagBadge />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <UserMenu profile={profile} userEmail={userEmail} />
      </SidebarFooter>
    </Sidebar>
  );
}
