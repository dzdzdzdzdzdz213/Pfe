-- 06_staff_permissions.sql
-- 1. Create is_staff helper
CREATE OR REPLACE FUNCTION is_staff() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM utilisateurs 
    WHERE auth_id = auth.uid() 
    AND role IN ('admin', 'administrateur', 'radiologue', 'receptionniste', 'assistant')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update utilisateurs RLS
-- Staff can SELECT any utilisateur
DROP POLICY IF EXISTS "Staff can select all utilisateurs" ON utilisateurs;
CREATE POLICY "Staff can select all utilisateurs" 
ON utilisateurs FOR SELECT 
TO authenticated 
USING (is_staff());

-- Staff can INSERT new utilisateurs (e.g., creating patients)
DROP POLICY IF EXISTS "Staff can insert utilisateurs" ON utilisateurs;
CREATE POLICY "Staff can insert utilisateurs" 
ON utilisateurs FOR INSERT 
TO authenticated 
WITH CHECK (is_staff());

-- Staff can UPDATE any utilisateur (for profile management)
DROP POLICY IF EXISTS "Staff can update all utilisateurs" ON utilisateurs;
CREATE POLICY "Staff can update all utilisateurs" 
ON utilisateurs FOR UPDATE 
TO authenticated 
USING (is_staff());

-- 3. Update patients RLS
-- Staff can do everything to patients
DROP POLICY IF EXISTS "Staff manage all patients" ON patients;
CREATE POLICY "Staff manage all patients" 
ON patients FOR ALL 
TO authenticated 
USING (is_staff())
WITH CHECK (is_staff());

-- 4. Storage Bucket Policies (General)
-- Allow public read/write to 'documents' bucket for anonymous booking uploads
-- NOTE: In production, tighten this with signed URLs or specific path restrictions.
-- But for now, ensuring anonymous users can upload to a 'public' subfolder.
-- This requires manual setup in Supabase UI, but I'll provide the logic here.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT DO NOTHING;

-- 5. Atomic Role Switching RPC
CREATE OR REPLACE FUNCTION switch_user_role(
  p_user_id UUID,
  p_new_role TEXT
) RETURNS VOID AS $$
BEGIN
  -- 1. Update the role in utilisateurs
  UPDATE utilisateurs SET role = p_new_role WHERE id = p_user_id;

  -- 2. Ensure role-specific profile exists
  IF p_new_role IN ('admin', 'administrateur') THEN
    INSERT INTO administrateurs (utilisateur_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
  ELSIF p_new_role = 'radiologue' THEN
    INSERT INTO radiologues (utilisateur_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
  ELSIF p_new_role IN ('receptionniste', 'assistant') THEN
    INSERT INTO receptionnistes (utilisateur_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
  ELSIF p_new_role = 'patient' THEN
    INSERT INTO patients (utilisateur_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
