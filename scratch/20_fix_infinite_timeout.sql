-- ============================================================
-- EMERGENCY FIX FOR DATABASE TIMEOUTS
-- ============================================================

-- If the "Check Email" step is timing out, your database has an infinite
-- loop in its Row Level Security (RLS) policies on the 'utilisateurs' table.
-- This script completely nukes all policies on that table and disables RLS.

DO $$
DECLARE 
    pol record;
BEGIN
    -- 1. Disable RLS on utilisateurs
    ALTER TABLE public.utilisateurs DISABLE ROW LEVEL SECURITY;

    -- 2. Drop EVERY existing policy on utilisateurs to stop infinite loops
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'utilisateurs')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.utilisateurs', pol.policyname);
    END LOOP;

    -- 3. Grant basic permissions again just in case
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.utilisateurs TO anon, authenticated, service_role;
END $$;
