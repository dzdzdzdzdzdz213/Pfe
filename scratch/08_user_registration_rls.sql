-- 08_user_registration_rls.sql
-- Fixes issue where new users (Google or Email sign-ups) could not insert their own data.

-- 1. Allow authenticated users to insert their own profile into utilisateurs
DROP POLICY IF EXISTS "Users can insert their own utilisateur" ON utilisateurs;
CREATE POLICY "Users can insert their own utilisateur" 
ON utilisateurs FOR INSERT 
TO authenticated 
WITH CHECK (auth_id = auth.uid());

-- 2. Allow authenticated users to insert their own patient record
DROP POLICY IF EXISTS "Users can insert their own patient record" ON patients;
CREATE POLICY "Users can insert their own patient record" 
ON patients FOR INSERT 
TO authenticated 
WITH CHECK (
  utilisateur_id IN (
    SELECT id FROM utilisateurs WHERE auth_id = auth.uid()
  )
);
