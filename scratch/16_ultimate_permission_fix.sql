-- ============================================================
-- ULTIMATE PERMISSION FIX — Run in Supabase SQL Editor
-- ============================================================

-- This script forcefully fixes the "permission denied" error AND
-- disables all Row Level Security (RLS) protections so your website works.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Fix Schema Permissions (Fixes "permission denied for schema public")
    EXECUTE 'GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role';
    EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role';
    EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role';
    EXECUTE 'GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role';

    -- 2. Loop through all tables to disable RLS completely
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        -- Disable RLS
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY;';
        
        -- Create an "Allow All" policy just in case RLS is turned back on later
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "Allow All" ON public.' || quote_ident(r.tablename) || ';';
            EXECUTE 'CREATE POLICY "Allow All" ON public.' || quote_ident(r.tablename) || ' FOR ALL USING (true) WITH CHECK (true);';
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if policy creation fails
        END;
    END LOOP;
END $$;
