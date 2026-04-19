-- 02_fix_rls.sql
-- Run this in Supabase SQL editor to fix the infinite recursion crash

-- 1. Create a SECURITY DEFINER function to bypass RLS safely when checking admin status
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM utilisateurs 
    WHERE auth_id = auth.uid() 
    AND role IN ('admin', 'administrateur')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop and recreate the SELECT policy safely using the bypass function
DROP POLICY IF EXISTS "Users can view their own record" ON utilisateurs;

CREATE POLICY "Users can view their own record"
ON utilisateurs
FOR SELECT
USING (
  auth.uid() = auth_id
  OR is_admin()
);
