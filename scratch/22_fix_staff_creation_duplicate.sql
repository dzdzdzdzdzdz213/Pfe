-- ============================================================
-- FIX: STAFF CREATION DUPLICATE ERROR
-- ============================================================

-- This script updates the 'create_staff_user' function to use UPSERT logic.
-- This prevents the "duplicate key value violates unique constraint" error
-- if a background trigger or race condition already created the profile.

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
    -- Insert into utilisateurs, or UPDATE if it already exists (Resilient to race conditions)
    INSERT INTO public.utilisateurs (auth_id, nom, prenom, email, telephone, role, profil_complet)
    VALUES (p_id, p_nom, p_prenom, p_email, p_telephone, p_role, true)
    ON CONFLICT (email) DO UPDATE SET
        auth_id = EXCLUDED.auth_id,
        nom = EXCLUDED.nom,
        prenom = EXCLUDED.prenom,
        telephone = EXCLUDED.telephone,
        role = EXCLUDED.role,
        profil_complet = true
    RETURNING id INTO v_user_id;

    -- Automatically create their profile in the correct role-specific table
    IF p_role = 'admin' THEN
        INSERT INTO public.administrateurs (utilisateur_id) 
        VALUES (v_user_id)
        ON CONFLICT DO NOTHING;
    ELSIF p_role = 'radiologue' THEN
        INSERT INTO public.radiologues (utilisateur_id, matricule_sante, specialite_principale) 
        VALUES (v_user_id, p_matricule_sante, p_specialite_principale)
        ON CONFLICT DO NOTHING;
    ELSIF p_role = 'receptionniste' THEN
        INSERT INTO public.receptionnistes (utilisateur_id) 
        VALUES (v_user_id)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$;
