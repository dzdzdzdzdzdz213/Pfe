-- ============================================================
-- CREATE ADMIN DASHBOARD FUNCTIONS — Run in Supabase SQL Editor
-- ============================================================

-- The Admin Dashboard relies on two special functions (RPCs) to securely
-- switch roles and create new staff members. Run this script to create them!

-- 1. Function to securely switch roles
CREATE OR REPLACE FUNCTION public.switch_user_role(
    p_user_id uuid,
    p_new_role text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the main role
    UPDATE public.utilisateurs SET role = p_new_role WHERE id = p_user_id;

    -- Automatically create their profile in the correct table
    IF p_new_role = 'admin' THEN
        IF NOT EXISTS (SELECT 1 FROM public.administrateurs WHERE utilisateur_id = p_user_id) THEN
            INSERT INTO public.administrateurs (utilisateur_id) VALUES (p_user_id);
        END IF;
    ELSIF p_new_role = 'radiologue' THEN
        IF NOT EXISTS (SELECT 1 FROM public.radiologues WHERE utilisateur_id = p_user_id) THEN
            INSERT INTO public.radiologues (utilisateur_id) VALUES (p_user_id);
        END IF;
    ELSIF p_new_role = 'receptionniste' THEN
        IF NOT EXISTS (SELECT 1 FROM public.receptionnistes WHERE utilisateur_id = p_user_id) THEN
            INSERT INTO public.receptionnistes (utilisateur_id) VALUES (p_user_id);
        END IF;
    ELSIF p_new_role = 'patient' THEN
        IF NOT EXISTS (SELECT 1 FROM public.patients WHERE utilisateur_id = p_user_id) THEN
            INSERT INTO public.patients (utilisateur_id) VALUES (p_user_id);
        END IF;
    END IF;
END;
$$;

-- 2. Function to securely create new staff accounts
CREATE OR REPLACE FUNCTION public.create_staff_user(
    p_id uuid,
    p_nom text,
    p_prenom text,
    p_email text,
    p_telephone text,
    p_role text,
    p_matricule_sante text DEFAULT NULL,
    p_specialite_principale text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Insert into utilisateurs
    INSERT INTO public.utilisateurs (auth_id, nom, prenom, email, telephone, role, profil_complet)
    VALUES (p_id, p_nom, p_prenom, p_email, p_telephone, p_role, true)
    RETURNING id INTO v_user_id;

    -- Insert into role-specific table
    IF p_role = 'admin' THEN
        INSERT INTO public.administrateurs (utilisateur_id) VALUES (v_user_id);
    ELSIF p_role = 'radiologue' THEN
        INSERT INTO public.radiologues (utilisateur_id, matricule_sante, specialite_principale)
        VALUES (v_user_id, p_matricule_sante, p_specialite_principale);
    ELSIF p_role = 'receptionniste' THEN
        INSERT INTO public.receptionnistes (utilisateur_id) VALUES (v_user_id);
    END IF;
END;
$$;

-- Grant permissions to use these functions
GRANT EXECUTE ON FUNCTION public.switch_user_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_staff_user(uuid, text, text, text, text, text, text, text) TO authenticated, service_role;
