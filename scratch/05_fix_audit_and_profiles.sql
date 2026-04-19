-- 05_fix_audit_and_profiles.sql
-- 1. Ensure Admins can read all audit logs
DROP POLICY IF EXISTS "Admins can see all audit logs" ON audit_logs;
CREATE POLICY "Admins can see all audit logs" 
ON audit_logs FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM utilisateurs 
    WHERE auth_id = auth.uid() 
    AND role IN ('admin', 'administrateur')
  )
);

-- 2. Allow insertion of audit logs by any authenticated user (already exists usually, but for safety)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" 
ON audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Ensure Radiologue profiles are readable by the owner and all staff
DROP POLICY IF EXISTS "Staff can read radiologue profiles" ON radiologues;
CREATE POLICY "Staff can read radiologue profiles" 
ON radiologues FOR SELECT 
TO authenticated 
USING (true);

-- 4. Fix table: receptionnistes RLS
DROP POLICY IF EXISTS "Staff can read receptionnistes" ON receptionnistes;
CREATE POLICY "Staff can read receptionnistes" 
ON receptionnistes FOR SELECT 
TO authenticated 
USING (true);

-- 5. Helper function to check if a user is admin (if not already exists)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM utilisateurs 
    WHERE auth_id = auth.uid() 
    AND role IN ('admin', 'administrateur')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
