-- ============================================================
-- ADD AGE COLUMN TO UTILISATEURS
-- ============================================================

-- The Profile page tries to save the user's age directly into the
-- utilisateurs table, but the column doesn't exist yet.
-- Run this in your Supabase SQL Editor to fix the issue:

ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS age integer;

-- Make sure permissions are still active
GRANT ALL ON TABLE public.utilisateurs TO anon, authenticated, service_role;
