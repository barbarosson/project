/*
  # Add Missing Foreign Key Columns for Views

  Adds columns needed by the summary views:
  - `stock_movements.project_id` - Links stock movements to projects
  - `projects.branch_id` - Links projects to branches

  No existing data is modified.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_movements' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE stock_movements ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stock_movements_project_id ON stock_movements(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_branch_id ON projects(branch_id);
