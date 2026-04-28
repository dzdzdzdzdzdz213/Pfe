-- Comprehensive RLS Policies Fix for Staff Visibility
-- Run this in the Supabase SQL Editor

-- 1. Enable RLS on all relevant tables
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiologues ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptionnistes ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrateurs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies (if any) to avoid conflicts
-- Note: Replace these with your actual policy names if different
DROP POLICY IF EXISTS "Users can view their own profile" ON utilisateurs;
DROP POLICY IF EXISTS "Staff can view all users" ON utilisateurs;
DROP POLICY IF EXISTS "Patients can view their own profile" ON patients;
DROP POLICY IF EXISTS "Staff can view all patients" ON patients;
DROP POLICY IF EXISTS "Radiologues can view all" ON radiologues;
DROP POLICY IF EXISTS "Receptionnistes can view all" ON receptionnistes;
DROP POLICY IF EXISTS "Admins can view all" ON administrateurs;

-- 3. UTILISATEURS POLICIES
-- Everyone can read their own profile
CREATE POLICY "Self read utilisateurs" ON utilisateurs 
FOR SELECT TO authenticated 
USING (auth_id = auth.uid() OR id = auth.uid());

-- Staff (admin, radiologue, receptionniste) can read ALL utilisateurs
CREATE POLICY "Staff read all utilisateurs" ON utilisateurs 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM utilisateurs u 
    WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()) 
    AND u.role IN ('admin', 'radiologue', 'receptionniste')
  )
);

-- Admin can do everything on utilisateurs
CREATE POLICY "Admin full access utilisateurs" ON utilisateurs 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM utilisateurs u 
    WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()) 
    AND u.role = 'admin'
  )
);

-- 4. PATIENTS POLICIES
-- Patient can read their own profile
CREATE POLICY "Patient self read" ON patients 
FOR SELECT TO authenticated 
USING (
  utilisateur_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid() OR id = auth.uid())
);

-- Staff can read all patients
CREATE POLICY "Staff read all patients" ON patients 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM utilisateurs u 
    WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()) 
    AND u.role IN ('admin', 'radiologue', 'receptionniste')
  )
);

-- Staff can insert/update patients
CREATE POLICY "Staff write patients" ON patients 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM utilisateurs u 
    WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()) 
    AND u.role IN ('admin', 'radiologue', 'receptionniste')
  )
);

-- 5. RADIOLOGUES, RECEPTIONNISTES, ADMINISTRATEURS POLICIES
-- Everyone authenticated can view staff profiles (needed for dropdowns)
CREATE POLICY "Authenticated read radiologues" ON radiologues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read receptionnistes" ON receptionnistes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read administrateurs" ON administrateurs FOR SELECT TO authenticated USING (true);

-- Admin can manage these tables
CREATE POLICY "Admin full access radiologues" ON radiologues FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM utilisateurs u WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()) AND u.role = 'admin')
);
CREATE POLICY "Admin full access receptionnistes" ON receptionnistes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM utilisateurs u WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()) AND u.role = 'admin')
);
CREATE POLICY "Admin full access administrateurs" ON administrateurs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM utilisateurs u WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()) AND u.role = 'admin')
);
