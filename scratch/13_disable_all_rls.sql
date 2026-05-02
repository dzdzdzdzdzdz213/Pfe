-- ============================================================
-- DISABLE ALL RLS — Run in Supabase SQL Editor
-- ============================================================

-- This script automatically finds every table in the 'public' schema 
-- and disables Row-Level Security on all of them.
-- WARNING: This makes your database publicly accessible via the API keys. 
-- Use this ONLY for development/testing environments.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY;';
        RAISE NOTICE 'Disabled RLS on table: %', r.tablename;
    END LOOP;
END $$;
