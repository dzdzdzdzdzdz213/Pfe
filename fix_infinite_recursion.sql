-- Fix for Infinite Recursion in RLS (Which breaks login!)
-- Run this in the Supabase SQL Editor

-- 1. We must DROP the recursive policies first
DROP POLICY IF EXISTS "Staff read all utilisateurs" ON utilisateurs;
DROP POLICY IF EXISTS "Admin full access utilisateurs" ON utilisateurs;
DROP POLICY IF EXISTS "Staff read all patients" ON patients;
DROP POLICY IF EXISTS "Staff write patients" ON patients;
DROP POLICY IF EXISTS "Admin full access radiologues" ON radiologues;
DROP POLICY IF EXISTS "Admin full access receptionnistes" ON receptionnistes;
DROP POLICY IF EXISTS "Admin full access administrateurs" ON administrateurs;

-- 2. Create a Security Definer function to safely get the current user's role without triggering RLS loops
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT role FROM public.utilisateurs WHERE auth_id = auth.uid() OR id = auth.uid() LIMIT 1;
$$;

-- 3. UTILISATEURS: Recreate policies safely using the function
CREATE POLICY "Staff read all utilisateurs" ON utilisateurs 
FOR SELECT TO authenticated 
USING ( get_my_role() IN ('admin', 'radiologue', 'receptionniste') );

CREATE POLICY "Admin full access utilisateurs" ON utilisateurs 
FOR ALL TO authenticated 
USING ( get_my_role() = 'admin' );

-- 4. PATIENTS: Recreate policies safely
CREATE POLICY "Staff read all patients" ON patients 
FOR SELECT TO authenticated 
USING ( get_my_role() IN ('admin', 'radiologue', 'receptionniste') );

CREATE POLICY "Staff write patients" ON patients 
FOR ALL TO authenticated 
USING ( get_my_role() IN ('admin', 'radiologue', 'receptionniste') );

-- 5. STAFF TABLES: Recreate admin policies safely
CREATE POLICY "Admin full access radiologues" ON radiologues FOR ALL TO authenticated 
USING ( get_my_role() = 'admin' );

CREATE POLICY "Admin full access receptionnistes" ON receptionnistes FOR ALL TO authenticated 
USING ( get_my_role() = 'admin' );

CREATE POLICY "Admin full access administrateurs" ON administrateurs FOR ALL TO authenticated 
USING ( get_my_role() = 'admin' );
