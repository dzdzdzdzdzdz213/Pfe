import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, User, Phone, Calendar, ArrowRight } from 'lucide-react';
import { StaggerContainer, FadeInItem } from '@/components/common/PageTransition';

export const Onboarding = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = z.object({
    nom: z.string().min(2, "Le nom est requis"),
    prenom: z.string().min(2, "Le prénom est requis"),
    telephone: z.string().min(8, "Le numéro de téléphone est requis"),
    date_naissance: role === 'patient' ? z.string().min(1, "La date de naissance est requise") : z.string().optional(),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Mettre à jour la table profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nom: data.nom,
          prenom: data.prenom,
          telephone: data.telephone,
          profil_complet: true
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Mettre à jour la table utilisateurs (garder synchronisé)
      const { error: userError } = await supabase
        .from('utilisateurs')
        .update({
          nom: data.nom,
          prenom: data.prenom,
          telephone: data.telephone
        })
        .eq('id', user.id);
        
      if (userError) throw userError;

      // Si c'est un patient, on ajoute la date de naissance !
      if (role === 'patient' && data.date_naissance) {
        const { error: patientError } = await supabase
          .from('patients')
          .upsert({ 
            utilisateur_id: user.id, 
            date_naissance: data.date_naissance 
          }, { onConflict: 'utilisateur_id' });
          
        if (patientError) throw patientError;
      }

      toast.success("Profil complété avec succès !");
      
      // Forcer le rafraîchissement global via window.location pour ré-hydrater correctement AuthContext
      // ou rediriger vers le dashboard approprié
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                />
                {errors.prenom && <p className="text-xs text-red-500 font-semibold mt-1">{errors.prenom.message}</p>}
              </FadeInItem>

              <FadeInItem className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Nom</label>
                <input
                  {...register('nom')}
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                />
                {errors.nom && <p className="text-xs text-red-500 font-semibold mt-1">{errors.nom.message}</p>}
              </FadeInItem>
            </div>

            <FadeInItem className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                <Phone className="h-3 w-3 mr-1.5 text-primary" />
                Téléphone
              </label>
              <input
                {...register('telephone')}
                placeholder="+213 XX XX XX XX"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm flex-1"
              />
              {errors.telephone && <p className="text-xs text-red-500 font-semibold mt-1">{errors.telephone.message}</p>}
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
