export type UserRole = "operator" | "account_manager" | "team_lead";

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  operator: "Operator",
  account_manager: "Account Manager",
  team_lead: "Team Lead",
};
