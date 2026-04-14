import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PhoneNumberPrompt = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkPhone = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('telephone')
        .eq('id', user.id)
        .single();

      if (!error && !data?.telephone) {
        setIsOpen(true);
      }
    };
    checkPhone();
  }, [user?.id]);

  const validateAlgerianPhone = (number) => {
    // Basic Algerian phone regex: (05, 06, 07) + 8 digits OR +213 format
    const regex = /^(?:(?:\+|00)213|0)[5-7](?:[0-9]){8}$/;
    return regex.test(number.replace(/\s/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAlgerianPhone(phone)) {
      setError(t('invalid_algerian_phone') || 'Veuillez entrer un numéro de téléphone algérien valide (ex: 0555123456 ou +213555123456).');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Update profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ telephone: phone })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update utilisateurs if applicable
      const { data: profileData } = await supabase.from('profiles').select('email').eq('id', user.id).single();
      if (profileData?.email || user?.email) {
          await supabase.from('utilisateurs').update({ telephone: phone }).eq('email', user?.email || profileData?.email);
      }

      setIsOpen(false);
    } catch (err) {
      setError(t('update_failed') || 'Une erreur est survenue lors de l\'enregistrement.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8">
            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Phone className="h-7 w-7" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-2 tracking-tight">
              {t('phone_number_required') || 'Ajoutez votre numéro de téléphone'}
            </h2>
            <p className="text-slate-500 text-center text-sm font-medium mb-8 leading-relaxed">
              {t('phone_number_subtitle') || 'Pour sécuriser votre compte et recevoir vos notifications médicales, veuillez saisir votre numéro de téléphone algérien.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  {t('telephone') || 'Numéro de téléphone'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'} rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 transition-all font-mono shadow-sm`}
                    placeholder="05 55 12 34 56"
                  />
                </div>
                {error && (
                  <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={saving || !phone}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(5,150,105,0.2)] mt-8"
              >
                {saving ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>{t('save') || 'Enregistrer mon numéro'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
