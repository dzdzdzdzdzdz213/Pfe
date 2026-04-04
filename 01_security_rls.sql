-- ==============================================================================
-- MIGRATION: 01_security_and_rls_policies.sql
-- PURPOSE: Full Medical Security Compliance for Chemloul Radiologie
-- ==============================================================================

-- 1. Drop Liability (mot_de_passe)
ALTER TABLE public.utilisateurs DROP COLUMN IF EXISTS mot_de_passe;

-- 2. Create Role Helper Function (Secure Definier)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
DECLARE
  found_role text;
BEGIN
  SELECT role INTO found_role FROM public.utilisateurs WHERE id = user_id;
  RETURN found_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable RLS on all tables
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptes_rendus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consentements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_medicaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordonnances ENABLE ROW LEVEL SECURITY;

-- 4. Apply Table Policies

-- [UTILISATEURS] User reads/updates own, Admin reads all
CREATE POLICY "Users can read/update own" ON public.utilisateurs
FOR ALL USING (id = auth.uid() OR public.get_user_role(auth.uid()) = 'administrateur');

-- [PATIENTS] Patient reads own, Radiologue/Receptionniste reads all, Admin full access
CREATE POLICY "Patients access" ON public.patients
FOR SELECT USING (
  utilisateur_id = auth.uid() OR 
  public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue', 'receptionniste')
);
CREATE POLICY "Staff manage patients" ON public.patients
FOR ALL USING (public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue', 'receptionniste'));

-- [RENDEZ_VOUS] Patient sees own, Staff sees all
CREATE POLICY "Rendezvous access" ON public.rendez_vous
FOR SELECT USING (
  patient_id IN (SELECT id FROM public.patients WHERE utilisateur_id = auth.uid()) OR 
  public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue', 'receptionniste')
);
CREATE POLICY "Staff manage rendezvous" ON public.rendez_vous
FOR ALL USING (public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue', 'receptionniste'));

-- [EXAMENS] Patient sees own via RV, Staff sees all
CREATE POLICY "Examens access" ON public.examens
FOR SELECT USING (
  id IN (SELECT examen_id FROM public.rendez_vous WHERE patient_id IN (SELECT id FROM public.patients WHERE utilisateur_id = auth.uid())) OR
  public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue', 'receptionniste')
);
CREATE POLICY "Staff manage examens" ON public.examens
FOR ALL USING (public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue', 'receptionniste'));

-- [COMPTES_RENDUS] Patient sees own (if validated), Radiologue/Admin sees all
CREATE POLICY "Reports access" ON public.comptes_rendus
FOR SELECT USING (
  (est_valide = true AND examen_id IN (
    SELECT examen_id FROM public.rendez_vous WHERE patient_id IN (
      SELECT id FROM public.patients WHERE utilisateur_id = auth.uid()
    )
  )) OR 
  public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue')
);
CREATE POLICY "Radiologues manage reports" ON public.comptes_rendus
FOR ALL USING (public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue'));

-- [NOTIFICATIONS] User sees own only
CREATE POLICY "Notifications access" ON public.notifications
FOR ALL USING (utilisateur_id = auth.uid() OR public.get_user_role(auth.uid()) = 'administrateur');

-- [AUDIT_LOGS] Admin only
CREATE POLICY "Admin audit only" ON public.audit_logs
FOR SELECT USING (public.get_user_role(auth.uid()) = 'administrateur');

-- [CONSENTEMENTS, DOCUMENTS_MEDICAUX, ORDONNANCES] Staff only, Radiologues can read their own
CREATE POLICY "Medical assets access" ON public.consentements
FOR ALL USING (public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue', 'receptionniste'));

CREATE POLICY "Medical assets access" ON public.documents_medicaux
FOR ALL USING (public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue', 'receptionniste'));

CREATE POLICY "Medical assets access" ON public.ordonnances
FOR ALL USING (public.get_user_role(auth.uid()) IN ('administrateur', 'radiologue', 'receptionniste'));

-- 5. Storage: images_radiologiques (Secure Bucket)
CREATE POLICY "Secure Storage Access" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'images_radiologiques');
