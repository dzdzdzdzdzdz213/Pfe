-- ============================================================
-- ADD MISSING COLUMNS — Run in Supabase SQL Editor
-- ============================================================

-- Looking at your schema, the `utilisateurs` table is missing two columns 
-- that the React application expects to use for Google Login and profile tracking.

-- 1. Add the auth_id column (to link to Supabase Auth)
ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS auth_id uuid;

-- 2. Add the profil_complet column
ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS profil_complet boolean DEFAULT false;

-- 3. Now we can safely add the unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'utilisateurs_auth_id_key'
    ) THEN
        ALTER TABLE public.utilisateurs ADD CONSTRAINT utilisateurs_auth_id_key UNIQUE (auth_id);
    END IF;
END $$;

-- 4. Ensure permissions are granted again just in case
GRANT ALL ON TABLE public.utilisateurs TO anon, authenticated, service_role;
