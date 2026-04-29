import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  User, Mail, Shield, Save, Loader2, Lock,
  Trash2, Eye, EyeOff, AlertTriangle, CheckCircle, X
} from 'lucide-react';

const INPUT = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all";
const LABEL = "text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block";

export const PatientProfile = () => {
  const { utilisateur, role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');

  // ── Personal form state ──────────────────────────────────────────────
  const [personalForm, setPersonalForm] = useState({
    prenom: '', nom: '', telephone: '', age: '', sexe: 'M',
  });
  const [personalLoading, setPersonalLoading] = useState(false);

  // ── Security form state ──────────────────────────────────────────────
  const [securityMode, setSecurityMode] = useState('password'); // 'password' | 'email'
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirm: '' });
  const [newEmail, setNewEmail] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  // ── Delete account state ─────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Load user data from utilisateurs table ───────────────────────────
  useEffect(() => {
    if (utilisateur) {
      setPersonalForm({
        prenom: utilisateur.prenom || '',
        nom: utilisateur.nom || '',
        telephone: utilisateur.telephone || '',
        age: utilisateur.age ? String(utilisateur.age) : '',
        sexe: utilisateur.sexe || 'M',
      });
    }
  }, [utilisateur]);

  // Also fetch sexe from patients table if patient role
  useEffect(() => {
    if (role === 'patient' && utilisateur?.id) {
      supabase
        .from('patients')
        .select('sexe, date_naissance')
        .eq('utilisateur_id', utilisateur.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.sexe) {
            setPersonalForm(p => ({ ...p, sexe: data.sexe }));
          }
        });
    }
  }, [role, utilisateur]);

  // ── 1. Update personal info ──────────────────────────────────────────
  const handleSavePersonal = async () => {
    if (!personalForm.nom || !personalForm.prenom) {
      return toast.error('Le nom et le prénom sont requis.');
    }
    setPersonalLoading(true);
    try {
      const { error } = await supabase
        .from('utilisateurs')
        .update({
          nom: personalForm.nom,
          prenom: personalForm.prenom,
          telephone: personalForm.telephone || null,
          age: personalForm.age ? parseInt(personalForm.age) : null,
        })
        .eq('id', utilisateur.id);
      if (error) throw error;

      // Update sexe in patients table if patient
      if (role === 'patient') {
        await supabase
          .from('patients')
          .update({ sexe: personalForm.sexe })
          .eq('utilisateur_id', utilisateur.id);
      }

      toast.success('Informations mises à jour avec succès !');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPersonalLoading(false);
    }
  };

  // ── 2a. Change password ──────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!passwordForm.newPass || passwordForm.newPass.length < 6) {
      return toast.error('Le mot de passe doit contenir au moins 6 caractères.');
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      return toast.error('Les mots de passe ne correspondent pas.');
    }
    setSecurityLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass });
      if (error) throw error;
      toast.success('Mot de passe modifié avec succès !');
      setPasswordForm({ newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  // ── 2b. Change email ─────────────────────────────────────────────────
  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      return toast.error('Veuillez entrer un email valide.');
    }
    setSecurityLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
      if (authError) throw authError;
      // Also update in utilisateurs table
      await supabase.from('utilisateurs').update({ email: newEmail }).eq('id', utilisateur.id);
      toast.success('Un email de confirmation a été envoyé à votre nouvelle adresse.');
      setNewEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  // ── 3. Delete account ────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      return toast.error('Veuillez taper SUPPRIMER pour confirmer.');
    }
    setDeleteLoading(true);
    try {
      // Delete role-specific rows first
      if (utilisateur?.id) {
        await supabase.from('patients').delete().eq('utilisateur_id', utilisateur.id);
        await supabase.from('radiologues').delete().eq('utilisateur_id', utilisateur.id);
        await supabase.from('receptionnistes').delete().eq('utilisateur_id', utilisateur.id);
        await supabase.from('administrateurs').delete().eq('utilisateur_id', utilisateur.id);
        await supabase.from('utilisateurs').delete().eq('id', utilisateur.id);
      }
      // Sign out (auth user deletion requires service role — sign out is sufficient for PFE)
      await logout();
      toast.success('Compte supprimé. Au revoir !');
    } catch (err) {
      toast.error(err.message);
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Informations', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'danger', label: 'Compte', icon: Trash2 },
  ];

  const sexeLabel = { M: 'Masculin', F: 'Féminin', Autre: 'Autre' };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mon Profil</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Gérez vos informations personnelles et paramètres de sécurité</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-2xl border border-primary/10 shadow-sm p-6 flex items-center gap-5 flex-wrap">
        <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary/30">
          {personalForm.prenom?.[0]?.toUpperCase()}{personalForm.nom?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-900">{personalForm.prenom} {personalForm.nom}</h2>
          <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {utilisateur?.email}
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {personalForm.age && (
              <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-600 border border-slate-200">
                {personalForm.age} ans
              </span>
            )}
            {(role === 'patient' && personalForm.sexe) && (
              <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-600 border border-slate-200">
                {sexeLabel[personalForm.sexe] || personalForm.sexe}
              </span>
            )}
            <span className={cn(
              'px-3 py-1 rounded-full text-xs font-bold border',
              role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              role === 'radiologue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              role === 'receptionniste' ? 'bg-teal-50 text-teal-700 border-teal-200' :
              'bg-slate-50 text-slate-600 border-slate-200'
            )}>
              {role === 'admin' ? 'Administrateur' :
               role === 'radiologue' ? 'Radiologue' :
               role === 'receptionniste' ? 'Assistant(e)' : 'Patient(e)'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2',
              activeTab === tab.id
                ? tab.id === 'danger'
                  ? 'bg-red-50 text-red-600 shadow-sm'
                  : 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Personal Info ─────────────────────────────────────── */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Informations personnelles
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Prénom</label>
              <input className={INPUT} value={personalForm.prenom}
                onChange={e => setPersonalForm(p => ({ ...p, prenom: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Nom</label>
              <input className={INPUT} value={personalForm.nom}
                onChange={e => setPersonalForm(p => ({ ...p, nom: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Téléphone</label>
              <input className={INPUT} value={personalForm.telephone} placeholder="+213 XX XX XX XX"
                onChange={e => setPersonalForm(p => ({ ...p, telephone: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Âge</label>
              <input type="number" min="1" max="120" className={INPUT} value={personalForm.age} placeholder="Votre âge"
                onChange={e => setPersonalForm(p => ({ ...p, age: e.target.value }))} />
            </div>
            {role === 'patient' && (
              <div>
                <label className={LABEL}>Sexe</label>
                <select className={INPUT} value={personalForm.sexe}
                  onChange={e => setPersonalForm(p => ({ ...p, sexe: e.target.value }))}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            )}
          </div>

          {/* Email (read only) */}
          <div>
            <label className={LABEL}>Email</label>
            <input className={cn(INPUT, 'bg-slate-100 text-slate-400 cursor-not-allowed')}
              value={utilisateur?.email || ''} disabled />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Pour changer l'email, allez dans l'onglet Sécurité.
            </p>
          </div>

          <button
            onClick={handleSavePersonal}
            disabled={personalLoading}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all"
          >
            {personalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer les modifications
          </button>
        </div>
      )}

      {/* ── TAB 2: Security ─────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Sécurité du compte
          </h3>

          {/* Mode Toggle */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setSecurityMode('password')}
              className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2',
                securityMode === 'password' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Lock className="h-3.5 w-3.5" /> Mot de passe
            </button>
            <button
              onClick={() => setSecurityMode('email')}
              className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2',
                securityMode === 'email' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
          </div>

          {/* Change Password */}
          {securityMode === 'password' && (
            <div className="space-y-4 max-w-sm">
              <div>
                <label className={LABEL}>Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={cn(INPUT, 'pr-12')}
                    value={passwordForm.newPass}
                    placeholder="Min. 6 caractères"
                    onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  className={cn(INPUT,
                    passwordForm.confirm && passwordForm.confirm !== passwordForm.newPass
                      ? 'border-red-300 focus:border-red-400' : ''
                  )}
                  value={passwordForm.confirm}
                  placeholder="Répétez le mot de passe"
                  onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                />
                {passwordForm.confirm && passwordForm.confirm !== passwordForm.newPass && (
                  <p className="text-xs text-red-500 font-semibold mt-1">Les mots de passe ne correspondent pas</p>
                )}
                {passwordForm.confirm && passwordForm.confirm === passwordForm.newPass && passwordForm.confirm.length >= 6 && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Les mots de passe correspondent
                  </p>
                )}
              </div>
              <button
                onClick={handleChangePassword}
                disabled={securityLoading || !passwordForm.newPass}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all"
              >
                {securityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Changer le mot de passe
              </button>
            </div>
          )}

          {/* Change Email */}
          {securityMode === 'email' && (
            <div className="space-y-4 max-w-sm">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                Un email de confirmation sera envoyé à votre nouvelle adresse avant le changement.
              </div>
              <div>
                <label className={LABEL}>Email actuel</label>
                <input className={cn(INPUT, 'bg-slate-100 text-slate-400 cursor-not-allowed')}
                  value={utilisateur?.email || ''} disabled />
              </div>
              <div>
                <label className={LABEL}>Nouvel email</label>
                <input
                  type="email"
                  className={INPUT}
                  value={newEmail}
                  placeholder="nouveau@email.com"
                  onChange={e => setNewEmail(e.target.value)}
                />
              </div>
              <button
                onClick={handleChangeEmail}
                disabled={securityLoading || !newEmail}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all"
              >
                {securityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Changer l'email
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Danger Zone ──────────────────────────────────────── */}
      {activeTab === 'danger' && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-extrabold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Zone de danger
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            La suppression de votre compte est <strong>définitive et irréversible</strong>. Toutes vos données seront effacées.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 flex items-center gap-2 shadow-lg shadow-red-100 transition-all"
          >
            <Trash2 className="h-4 w-4" /> Supprimer mon compte
          </button>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────── */}
      {showDeleteModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Confirmer la suppression
              </h2>
              <button onClick={() => setShowDeleteModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 font-medium mb-4">
              Pour confirmer, tapez <strong className="text-red-600">SUPPRIMER</strong> dans le champ ci-dessous.
            </p>
            <input
              className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-red-100 focus:border-red-400 text-red-700 mb-4"
              placeholder="SUPPRIMER"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'SUPPRIMER' || deleteLoading}
                className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 flex items-center gap-2 disabled:opacity-40 transition-all"
              >
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Supprimer définitivement
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
