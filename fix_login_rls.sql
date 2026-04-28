-- Fix for User Login / Registration (Insert/Update RLS Policies)
-- Run this in the Supabase SQL Editor

-- UTILISATEURS (Allow authenticated users to insert their own profile)
CREATE POLICY "Users can insert their own profile" ON utilisateurs
FOR INSERT TO authenticated
WITH CHECK (auth_id = auth.uid() OR id = auth.uid());

-- UTILISATEURS (Allow authenticated users to update their own profile)
CREATE POLICY "Users can update their own profile" ON utilisateurs
FOR UPDATE TO authenticated
USING (auth_id = auth.uid() OR id = auth.uid());

-- PATIENTS (Allow authenticated users to insert their own patient record)
CREATE POLICY "Patients can insert their own record" ON patients
FOR INSERT TO authenticated
WITH CHECK (
  utilisateur_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid() OR id = auth.uid())
);

-- PATIENTS (Allow authenticated users to update their own patient record)
CREATE POLICY "Patients can update their own record" ON patients
FOR UPDATE TO authenticated
USING (
  utilisateur_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid() OR id = auth.uid())
);

-- RADIOLOGUES, RECEPTIONNISTES, ADMINISTRATEURS (Allow self insert/update)
CREATE POLICY "Radiologues self insert" ON radiologues FOR INSERT TO authenticated WITH CHECK (
  utilisateur_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid() OR id = auth.uid())
);
CREATE POLICY "Radiologues self update" ON radiologues FOR UPDATE TO authenticated USING (
  utilisateur_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid() OR id = auth.uid())
);

CREATE POLICY "Receptionnistes self insert" ON receptionnistes FOR INSERT TO authenticated WITH CHECK (
  utilisateur_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid() OR id = auth.uid())
);
CREATE POLICY "Receptionnistes self update" ON receptionnistes FOR UPDATE TO authenticated USING (
  utilisateur_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid() OR id = auth.uid())
);

CREATE POLICY "Administrateurs self insert" ON administrateurs FOR INSERT TO authenticated WITH CHECK (
  utilisateur_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid() OR id = auth.uid())
);
CREATE POLICY "Administrateurs self update" ON administrateurs FOR UPDATE TO authenticated USING (
  utilisateur_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid() OR id = auth.uid())
);
