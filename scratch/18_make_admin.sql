-- ============================================================
-- MAKE USER AN ADMIN — Run in Supabase SQL Editor
-- ============================================================

-- Replace 'votre@email.com' with the email of the user you want to make admin
DO $$
DECLARE
    target_user_id uuid;
    target_email text := 'votre@email.com'; -- <--- CHANGE THIS EMAIL
BEGIN
    -- 1. Find the user by their email
    SELECT id INTO target_user_id FROM public.utilisateurs WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        -- 2. Update their role to 'admin' in the utilisateurs table
        UPDATE public.utilisateurs SET role = 'admin' WHERE id = target_user_id;

        -- 3. Ensure they have a record in the administrateurs table
        IF NOT EXISTS (SELECT 1 FROM public.administrateurs WHERE utilisateur_id = target_user_id) THEN
            INSERT INTO public.administrateurs (utilisateur_id) VALUES (target_user_id);
        END IF;
        
        RAISE NOTICE 'Success: User % is now an admin.', target_email;
    ELSE
        RAISE EXCEPTION 'Error: Could not find user with email %', target_email;
    END IF;
END $$;
