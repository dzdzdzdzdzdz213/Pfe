import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { User, Mail, Shield, Save, Loader2, Lock, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const PatientProfile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal');

  const { data: patientData, isLoading } = useQuery({
    queryKey: ['patient-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient')
        .select('*, utilisateur:utilisateur_id(*), dossier:dossier_medical(*)')
        .eq('utilisateur_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [personalForm, setPersonalForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [medicalForm, setMedicalForm] = useState({});

  React.useEffect(() => {
    if (patientData) {
      setPersonalForm({
        nom: patientData.utilisateur?.nom || '',
        prenom: patientData.utilisateur?.prenom || '',
        email: patientData.utilisateur?.email || '',
        telephone: patientData.utilisateur?.telephone || '',
        adresse: patientData.adresse || '',
        date_naissance: patientData.date_naissance || '',
        sexe: patientData.sexe || 'M',
        telephoneUrgence: patientData.telephoneUrgence || '',
      });
      setMedicalForm({
        allergies: patientData.dossier?.[0]?.allergies || '',
        antecedentsMedicaux: patientData.dossier?.[0]?.antecedentsMedicaux || '',
      });
    }
  }, [patientData]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('utilisateur').update({
        nom: personalForm.nom,
        prenom: personalForm.prenom,
        telephone: personalForm.telephone,
      }).eq('id', user?.id);
      
      await supabase.from('patient').update({
        adresse: personalForm.adresse,
        telephoneUrgence: personalForm.telephoneUrgence,
      }).eq('utilisateur_id', user?.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] });
      toast.success(t('profile_update_success'));
    },
    onError: (err) => toast.error(err.message),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (passwordForm.new !== passwordForm.confirm) throw new Error(t('error_passwords_mismatch'));
      if (passwordForm.new.length < 6) throw new Error(t('error_password_too_short'));
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('profile_password_success'));
      setPasswordForm({ current: '', new: '', confirm: '' });
    },
    onError: (err) => toast.error(err.message),
  });

  const tabs = [
    { id: 'personal', label: t('profile_tab_info'), icon: User },
    { id: 'security', label: t('profile_tab_security'), icon: Shield },
    { id: 'medical', label: t('profile_tab_medical'), icon: Heart },
  ];

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center"><div className="h-10 w-10 border-b-2 border-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('profile_title')}</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{t('profile_subtitle')}</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5 flex-wrap">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/20">
          {personalForm.prenom?.[0]}{personalForm.nom?.[0]}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{personalForm.prenom} {personalForm.nom}</h2>
          <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5"><Mail className="h-3.5 w-3.5" />{personalForm.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-0">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('px-5 py-3 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 -mb-px',
              activeTab === tab.id ? 'text-primary border-primary bg-white' : 'text-slate-500 border-transparent hover:text-slate-700')}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Personal Info */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('first_name')}</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={personalForm.prenom} onChange={e => setPersonalForm(p => ({ ...p, prenom: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('last_name')}</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={personalForm.nom} onChange={e => setPersonalForm(p => ({ ...p, nom: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('phone')}</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={personalForm.telephone} onChange={e => setPersonalForm(p => ({ ...p, telephone: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('phone_emergency')}</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={personalForm.telephoneUrgence} onChange={e => setPersonalForm(p => ({ ...p, telephoneUrgence: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('address')}</label>
            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={personalForm.adresse} onChange={e => setPersonalForm(p => ({ ...p, adresse: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('login_email')}</label>
            <input className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500" value={personalForm.email} disabled />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">{t('profile_email_locked')}</p>
          </div>
          <button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100">
            {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('save')}
          </button>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-extrabold text-slate-800">{t('profile_change_password')}</h3>
          <div className="max-w-sm space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('profile_new_password')}</label>
              <input type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={passwordForm.new} onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('profile_confirm_password')}</label>
              <input type="password" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} />
            </div>
            <button onClick={() => changePasswordMutation.mutate()} disabled={changePasswordMutation.isPending}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100">
              {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} {t('profile_modify_password')}
            </button>
          </div>
        </div>
      )}

      {/* Medical */}
      {activeTab === 'medical' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-extrabold text-slate-800">{t('records_medical_summary')}</h3>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('records_allergies')}</label>
            <textarea rows={3} placeholder={t('profile_allergies_hint')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none" value={medicalForm.allergies} onChange={e => setMedicalForm(p => ({ ...p, allergies: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('records_antecedents')}</label>
            <textarea rows={4} placeholder={t('profile_antecedents_hint')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none" value={medicalForm.antecedentsMedicaux} onChange={e => setMedicalForm(p => ({ ...p, antecedentsMedicaux: e.target.value }))} />
          </div>
          <button onClick={() => toast.success(t('profile_medical_success'))} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100">
            <Save className="h-4 w-4" /> {t('save')}
          </button>
        </div>
      )}
    </div>
  );
};
