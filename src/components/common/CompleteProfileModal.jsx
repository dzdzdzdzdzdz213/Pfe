import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Save, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const CompleteProfileModal = ({ user, userData, onComplete }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nom: userData?.nom || user?.user_metadata?.full_name?.split(' ')[1] || '',
    prenom: userData?.prenom || user?.user_metadata?.full_name?.split(' ')[0] || '',
    age: userData?.age || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom || !formData.age) {
      toast.error(t('error_required_fields'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Update utilisateurs table
      const { error: utilError } = await supabase
        .from('utilisateurs')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          profil_complet: true
        })
        .eq('id', user.id);

      if (utilError) throw utilError;

      toast.success(t('profile_updated_success') || 'Profil mis à jour !');
      onComplete();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{t('complete_profile_title') || 'Finalisez votre profil'}</h2>
              <p className="text-sm text-slate-500 font-medium">{t('complete_profile_subtitle') || 'Juste quelques détails pour mieux vous servir'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">{t('last_name')}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-700 text-sm"
                    placeholder="Nom"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">{t('first_name')}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-700 text-sm"
                    placeholder="Prénom"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">{t('age')}</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-700 text-sm"
                  placeholder="Âge"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {t('save_profile') || 'Enregistrer mon profil'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
