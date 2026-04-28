-- Update trigger to handle manual_signup flag
-- Manual signups = profil_complet true immediately (no onboarding popup)
-- Google signups = profil_complet false (onboarding popup shows)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role        text;
  v_nom         text;
  v_prenom      text;
  v_telephone   text;
  v_full_name   text;
  v_name_parts  text[];
  v_util_id     uuid;
  v_manual      boolean;
  v_profil_ok   boolean;
BEGIN
  -- Extract metadata
  v_role      := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  v_nom       := COALESCE(NEW.raw_user_meta_data->>'nom', '');
  v_prenom    := COALESCE(NEW.raw_user_meta_data->>'prenom', '');
  v_telephone := NEW.raw_user_meta_data->>'telephone';
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_manual    := (NEW.raw_user_meta_data->>'manual_signup')::boolean;

  -- For manual signup: all fields provided, profil is complete
  -- For Google: no nom/prenom/telephone, needs onboarding
  v_profil_ok := COALESCE(v_manual, false) OR 
                 (v_telephone IS NOT NULL AND v_telephone <> '');

  -- Fallback name split for Google users
  IF v_prenom = '' OR v_nom = '' THEN
    v_name_parts := string_to_array(v_full_name, ' ');
    IF v_prenom = '' THEN v_prenom := COALESCE(v_name_parts[1], 'Utilisateur'); END IF;
    IF v_nom = ''    THEN v_nom    := COALESCE(v_name_parts[array_length(v_name_parts,1)], 'Inconnu'); END IF;
  END IF;

  -- Normalize role
  IF v_role NOT IN ('admin','radiologue','receptionniste','patient') THEN
    v_role := 'patient';
  END IF;

  -- Upsert utilisateur
  INSERT INTO public.utilisateurs (auth_id, nom, prenom, email, telephone, role, profil_complet)
  VALUES (NEW.id, v_nom, v_prenom, NEW.email, v_telephone, v_role, v_profil_ok)
  ON CONFLICT (auth_id) DO UPDATE
    SET nom            = EXCLUDED.nom,
        prenom         = EXCLUDED.prenom,
        telephone      = COALESCE(EXCLUDED.telephone, utilisateurs.telephone),
        profil_complet = EXCLUDED.profil_complet
  RETURNING id INTO v_util_id;

  IF v_util_id IS NULL THEN
    SELECT id INTO v_util_id FROM public.utilisateurs WHERE auth_id = NEW.id;
  END IF;

  -- Create role-specific row
  IF v_role = 'patient' THEN
    INSERT INTO public.patients (utilisateur_id) VALUES (v_util_id) ON CONFLICT DO NOTHING;
  ELSIF v_role = 'radiologue' THEN
    INSERT INTO public.radiologues (utilisateur_id) VALUES (v_util_id) ON CONFLICT DO NOTHING;
  ELSIF v_role = 'receptionniste' THEN
    INSERT INTO public.receptionnistes (utilisateur_id) VALUES (v_util_id) ON CONFLICT DO NOTHING;
  ELSIF v_role = 'admin' THEN
    INSERT INTO public.administrateurs (utilisateur_id) VALUES (v_util_id) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;
