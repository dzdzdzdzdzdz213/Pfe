import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, User, Phone, Calendar, ArrowRight } from 'lucide-react';
import { StaggerContainer, FadeInItem } from '@/components/common/PageTransition';

export const Onboarding = () => {
  const { user, utilisateur, role } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = z.object({
    nom: z.string().min(2, "Le nom est requis"),
    prenom: z.string().min(2, "Le prénom est requis"),
    telephone: z.string().min(8, "Le numéro de téléphone est requis"),
    sexe: z.enum(['M', 'F']).default('M'),
    date_naissance: role === 'patient' ? z.string().min(1, "La date de naissance est requise") : z.string().optional(),
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: '',
      prenom: '',
      telephone: '',
      sexe: 'M',
      date_naissance: ''
    }
  });

  const formatAlgerianPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0,2)} ${digits.slice(2)}`;
    if (digits.length <= 6) return `${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4)}`;
    if (digits.length <= 8) return `${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4,6)} ${digits.slice(6)}`;
    return `${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4,6)} ${digits.slice(6,8)} ${digits.slice(8)}`;
  };

  const validateAlgerianPhone = (phone) => {
    const cleaned = phone.replace(/\s/g, '');
    return /^(05|06|07)\d{8}$/.test(cleaned);
  };

  const onSubmit = async (data) => {
    if (!validateAlgerianPhone(data.telephone)) {
      toast.error('Format de téléphone invalide (05/06/07 XX XX XX XX)');
      return;
    }
    setIsSubmitting(true);
    try {
      // Fix: use auth_id to identify the current user in utilisateurs
      const { error: userError } = await supabase
        .from('utilisateurs')
        .update({
          nom: data.nom,
          prenom: data.prenom,
          telephone: data.telephone,
          profil_complet: true
        })
        .eq('auth_id', user.id);
        
      if (userError) throw userError;

      // For patient: update date_naissance using the utilisateur's DB id (not auth id)
      if (role === 'patient' && utilisateur?.id) {
        // Use maybeSingle() to safely handle 0 rows without throwing
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('utilisateur_id', utilisateur.id)
          .maybeSingle();

        if (existingPatient?.id) {
          const { error: patientError } = await supabase
            .from('patients')
            .update({ date_naissance: data.date_naissance, sexe: data.sexe || 'M' })
            .eq('id', existingPatient.id);
          if (patientError) throw patientError;
        } else {
          const { error: patientError } = await supabase
            .from('patients')
            .insert({ utilisateur_id: utilisateur.id, date_naissance: data.date_naissance, sexe: data.sexe || 'M' });
          if (patientError) throw patientError;
        }
      }

      toast.success("Profil complété avec succès !");
      
      const dest = role === 'admin' ? '/admin/dashboard' : `/${role}/dashboard`;
      window.location.href = dest;
      
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la sauvegarde : ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-xl">
        <StaggerContainer className="space-y-6">
          <FadeInItem className="text-center space-y-2">
            <div className="h-16 w-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <User className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Finalisez votre profil</h1>
            <p className="text-sm text-slate-500 font-medium">
              Veuillez compléter ces informations essentielles pour continuer vers votre espace de gestion.
            </p>
          </FadeInItem>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <FadeInItem className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Prénom</label>
                <input
                  {...register('prenom')}
                  placeholder="Votre prénom"
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, '');
                    setValue('prenom', val);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                />
                {errors.prenom && <p className="text-xs text-red-500 font-semibold mt-1">{errors.prenom.message}</p>}
              </FadeInItem>

              <FadeInItem className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Nom</label>
                <input
                  {...register('nom')}
                  placeholder="Votre nom"
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, '');
                    setValue('nom', val);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                />
                {errors.nom && <p className="text-xs text-red-500 font-semibold mt-1">{errors.nom.message}</p>}
              </FadeInItem>
            </div>

            <FadeInItem className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                <Phone className="h-3 w-3 mr-1.5 text-primary" />
                Téléphone <span className="ml-1 text-[10px] lowercase text-slate-400 font-normal">(05/06/07 XX XX XX XX)</span>
              </label>
              <input
                {...register('telephone')}
                placeholder="06 12 34 56 78"
                maxLength={14}
                onChange={(e) => {
                  const formatted = formatAlgerianPhone(e.target.value);
                  setValue('telephone', formatted);
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm flex-1"
              />
              {errors.telephone && <p className="text-xs text-red-500 font-semibold mt-1">{errors.telephone.message}</p>}
            </FadeInItem>

            <FadeInItem className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Genre</label>
              <select
                {...register('sexe')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </FadeInItem>

            {role === 'patient' && (
              <FadeInItem className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <Calendar className="h-3 w-3 mr-1.5 text-primary" />
                  Date de naissance (Âge)
                </label>
                <input
                  type="date"
                  {...register('date_naissance')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-semibold text-slate-700"
                />
                {errors.date_naissance && <p className="text-xs text-red-500 font-semibold mt-1">{errors.date_naissance.message}</p>}
              </FadeInItem>
            )}

            <FadeInItem className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none group"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  <>
                    Accéder au portail
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </FadeInItem>

          </form>
        </StaggerContainer>
      </div>
    </div>
  );
};
