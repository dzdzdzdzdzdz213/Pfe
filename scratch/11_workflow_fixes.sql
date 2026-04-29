-- ============================================================
-- WORKFLOW FIX SCRIPT — Run in Supabase SQL Editor
-- ============================================================

-- 1. SEED SERVICES TABLE
INSERT INTO public.services (nom, description) VALUES
  ('Radiographie', 'Radiographie standard (thorax, membres, colonne)'),
  ('Échographie', 'Échographie abdominale, pelvienne, cardiaque'),
  ('Scanner (TDM)', 'Tomodensitométrie — scanner corps entier ou ciblé'),
  ('IRM', 'Imagerie par résonance magnétique'),
  ('Mammographie', 'Dépistage et diagnostic du cancer du sein'),
  ('Ostéodensitométrie', 'Mesure de la densité osseuse'),
  ('Panoramique dentaire', 'Radiographie panoramique maxillo-faciale')
ON CONFLICT (nom) DO NOTHING;

-- 2. ADD UNIQUE CONSTRAINT ON ordonnances.examen_id (safe version)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ordonnances_examen_id_unique'
  ) THEN
    ALTER TABLE public.ordonnances
      ADD CONSTRAINT ordonnances_examen_id_unique UNIQUE (examen_id);
  END IF;
END $$;

-- 3. AUTO-CREATE dossier_medical TRIGGER for new patients
CREATE OR REPLACE FUNCTION public.handle_new_patient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.dossiers_medicaux (patient_id)
  VALUES (NEW.id)
  ON CONFLICT (patient_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'handle_new_patient error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_patient_created ON public.patients;
CREATE TRIGGER on_patient_created
  AFTER INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_patient();

-- 4. BACKFILL dossier_medical for existing patients
INSERT INTO public.dossiers_medicaux (patient_id)
SELECT id FROM public.patients
WHERE id NOT IN (
  SELECT patient_id FROM public.dossiers_medicaux WHERE patient_id IS NOT NULL
)
ON CONFLICT (patient_id) DO NOTHING;

-- 5. Disable RLS on all workflow tables
ALTER TABLE public.examens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers_medicaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_medicaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptes_rendus DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordonnances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.images_radiologiques DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendez_vous DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.consentements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
