-- ============================================================
-- KILL ALL FROZEN TRANSACTIONS
-- ============================================================

-- If a previous SQL script failed halfway, it might have left the 
-- database in a "locked" state, causing all queries to that table 
-- to wait forever (hang).

-- This script forcefully closes all other active or frozen connections
-- to instantly unlock your tables.

SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE pid <> pg_backend_pid()
  AND state IN ('idle in transaction', 'active', 'idle');
