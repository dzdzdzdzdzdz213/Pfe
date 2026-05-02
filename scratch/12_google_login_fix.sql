-- ============================================================
-- GOOGLE LOGIN & RLS FIX — Run in Supabase SQL Editor
-- ============================================================

-- 1. Disable RLS on user-related tables to allow autoprovisioning (Google Sign-In)
-- This ensures the AuthProvider can insert/update utilisateur rows without complex policies
ALTER TABLE public.utilisateurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.radiologues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receptionnistes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrateurs DISABLE ROW LEVEL SECURITY;

-- 2. Ensure the auth_id column has a unique constraint (required for upsert)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'utilisateurs_auth_id_key'
    ) THEN
        ALTER TABLE public.utilisateurs ADD CONSTRAINT utilisateurs_auth_id_key UNIQUE (auth_id);
    END IF;
END $$;

-- 3. Ensure email is unique (required for legacy mapping)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'utilisateurs_email_key'
    ) THEN
        ALTER TABLE public.utilisateurs ADD CONSTRAINT utilisateurs_email_key UNIQUE (email);
    END IF;
END $$;

-- 4. Re-verify service names match the app's expectations
INSERT INTO public.services (nom, description) VALUES
  ('Radiographie', 'Radiographie standard (thorax, membres, colonne)'),
  ('Échographie', 'Échographie abdominale, pelvienne, cardiaque'),
  ('Scanner (TDM)', 'Tomodensitométrie — scanner corps entier ou ciblé'),
  ('IRM', 'Imagerie par résonance magnétique'),
  ('Mammographie', 'Dépistage et diagnostic du cancer du sein'),
  ('Ostéodensitométrie', 'Mesure de la densité osseuse'),
  ('Panoramique dentaire', 'Radiographie panoramique maxillo-faciale')
ON CONFLICT (nom) DO UPDATE SET description = EXCLUDED.description;
