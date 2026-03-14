-- PROJ-7: Account Manager Campaign Summary — Database Tables
-- Run this migration in the Supabase SQL Editor

-- ============================================================
-- 1. am_talking_points — editable talking points per user/workspace/week
-- ============================================================
CREATE TABLE IF NOT EXISTS am_talking_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace text NOT NULL,
  week_start date NOT NULL,
  auto_generated text,
  user_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace, week_start)
);

-- Index for fast lookup by user + workspace
CREATE INDEX IF NOT EXISTS idx_am_talking_points_user_workspace
  ON am_talking_points (user_id, workspace);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_am_talking_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_am_talking_points_updated_at ON am_talking_points;
CREATE TRIGGER trg_am_talking_points_updated_at
  BEFORE UPDATE ON am_talking_points
  FOR EACH ROW
  EXECUTE FUNCTION update_am_talking_points_updated_at();

-- RLS
ALTER TABLE am_talking_points ENABLE ROW LEVEL SECURITY;

-- Users can read their own talking points
CREATE POLICY "Users can read own talking points"
  ON am_talking_points FOR SELECT
  USING (user_id = auth.uid());

-- Team leads can read all talking points
CREATE POLICY "Team leads can read all talking points"
  ON am_talking_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'team_lead'
    )
  );

-- Users can insert their own talking points
CREATE POLICY "Users can insert own talking points"
  ON am_talking_points FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own talking points
CREATE POLICY "Users can update own talking points"
  ON am_talking_points FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 2. workspace_assignments — which workspaces are assigned to which users
-- ============================================================
CREATE TABLE IF NOT EXISTS workspace_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace text NOT NULL,
  assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_workspace_assignments_user
  ON workspace_assignments (user_id);

-- RLS
ALTER TABLE workspace_assignments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read assignments
CREATE POLICY "Authenticated users can read assignments"
  ON workspace_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only team leads can insert assignments
CREATE POLICY "Team leads can insert assignments"
  ON workspace_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'team_lead'
    )
  );

-- Only team leads can update assignments
CREATE POLICY "Team leads can update assignments"
  ON workspace_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'team_lead'
    )
  );

-- Only team leads can delete assignments
CREATE POLICY "Team leads can delete assignments"
  ON workspace_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'team_lead'
    )
  );
