import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Bell, Lock, AlertTriangle, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const ProfileSettings = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    system: true
  });

  useEffect(() => {
    const saved = localStorage.getItem(`prefs_${user?.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.notifications) setNotifications(parsed.notifications);
    }
  }, [user?.id]);

  const [profileData, setProfileData] = useState({
    nom: '',
    prenom: '',
    age: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('nom, prenom, age')
        .eq('auth_id', user.id)
        .single();
      
      if (data && !error) {
        setProfileData({
          nom: data.nom || '',
          prenom: data.prenom || '',
          age: data.age || ''
        });
      }
    };
    fetchProfile();
  }, [user?.id]);

  const getRoleColor = (r) => {
    switch (r) {
      case 'administrateur': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'radiologue': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'receptionniste': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'patient': return 'text-slate-600 bg-slate-50 border-slate-200';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update notifications in auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { notifications }
      });
      if (authError) throw authError;

      // Update names and age in utilisateurs table
      const { error: profileError } = await supabase
        .from('utilisateurs')
        .update({
          nom: profileData.nom,
          prenom: profileData.prenom,
          age: parseInt(profileData.age) || null
        })
        .eq('auth_id', user.id);
      
      if (profileError) throw profileError;

      localStorage.setItem(`prefs_${user?.id}`, JSON.stringify({ notifications }));
      toast.success('Vos modifications ont été enregistrées avec succès', {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    setIsDeleting(true);
    try {
      // 1. Delete application data (cascading across role tables)
      // NOTE: Supabase Auth credentials (login) can only be fully deleted via the 
      // Supabase dashboard or a service role Edge Function.
      await Promise.all([
        supabase.from('administrateurs').delete().eq('utilisateur_id', user.id),
        supabase.from('radiologues').delete().eq('utilisateur_id', user.id),
        supabase.from('receptionnistes').delete().eq('utilisateur_id', user.id),
        supabase.from('patients').delete().eq('utilisateur_id', user.id)
      ]);
      
      const { error: dataError } = await supabase
        .from('utilisateurs')
        .delete()
        .eq('id', user.id);
      if (dataError) throw dataError;

      // 2. Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/';
      toast.success('Votre compte a été supprimé');
    } catch (err) {
      toast.error(err.message);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Segment */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60"></div>
        
        <div className="h-32 w-32 rounded-[2rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 flex-shrink-0 relative z-10">
          <User className="h-16 w-16" />
        </div>
        
        <div className="flex-1 text-center md:text-left relative z-10 pt-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {profileData.prenom} {profileData.nom}
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
            <div className="flex items-center text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <Mail className="h-4 w-4 mr-2" />
              {user?.email}
            </div>
            <div className={`flex items-center px-4 py-2 rounded-xl border font-bold uppercase tracking-wider text-xs ${getRoleColor(role)}`}>
              <Shield className="h-4 w-4 mr-2" />
              {role}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
        >
          <User className="h-4 w-4 mr-2" /> Informations Personnelles
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
        >
          <Bell className="h-4 w-4 mr-2" /> Préférences & Sécurité
        </button>
      </div>

      {/* Content Area */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100"
      >
        {activeTab === 'profile' ? (
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center border-b border-slate-100 pb-4">
              Informations du Compte
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Prénom</label>
                <input 
                  type="text" 
                  value={profileData.prenom} 
                  onChange={e => setProfileData({...profileData, prenom: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Nom</label>
                <input 
                  type="text" 
                  value={profileData.nom} 
                  onChange={e => setProfileData({...profileData, nom: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Âge</label>
                <input 
                  type="number" 
                  value={profileData.age} 
                  onChange={e => setProfileData({...profileData, age: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Niveau d'Accès</label>
                <input 
                  type="text" 
                  disabled 
                  value={role?.toUpperCase() || ''} 
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-500 font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Mode Démonstration Actif</h4>
                <p className="text-sm font-medium text-blue-700 leading-relaxed">
                  Vous êtes actuellement connecté avec un compte de démonstration. Pour des raisons de sécurité, la modification du mot de passe et de l'email est verrouillée sur cet environnement.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center disabled:opacity-70"
              >
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</> : <><Save className="h-4 w-4 mr-2" /> Enregistrer</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center border-b border-slate-100 pb-4">
              Notifications & Sécurité
            </h3>
            
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-sm tracking-wide">Préférences de Notification</h4>
              
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setNotifications({...notifications, email: !notifications.email})}>
                <div>
                  <p className="font-bold text-slate-800">Notifications par Email</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Recevoir un email lors de la disponibilité d'un compte-rendu.</p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${notifications.email ? 'bg-primary' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>

              {role === 'patient' && (
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setNotifications({...notifications, sms: !notifications.sms})}>
                  <div>
                    <p className="font-bold text-slate-800">Rappels par SMS</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">Recevoir un SMS 24h avant votre rendez-vous.</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${notifications.sms ? 'bg-primary' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifications.sms ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
              <h4 className="font-bold text-slate-700 text-sm tracking-wide">Sécurité d'Accès</h4>
              
              <div className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Mot de passe</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">Dernière modification il y a 3 mois</p>
                  </div>
                </div>
                <button disabled className="px-5 py-2.5 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed">
                  Modifier (Désactivé en Démo)
                </button>
              </div>

              {/* Danger Zone */}
              <div className="mt-12 p-6 border-2 border-red-50 rounded-2xl bg-red-50/30">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-red-900">Zone de Danger</h4>
                    <p className="text-sm font-medium text-red-700/80 mt-1">
                      La suppression de votre compte est irréversible. Toutes vos données cliniques et vos informations de profil seront définitivement effacées.
                    </p>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="mt-4 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
                    >
                      Supprimer mon compte
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative z-10 shadow-2xl border border-slate-100"
          >
            <div className="h-20 w-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-600 mb-6 mx-auto">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 text-center mb-4">Êtes-vous absolument sûr ?</h3>
            <p className="text-slate-600 text-center font-medium leading-relaxed mb-8">
              Cette action supprimera définitivement votre profil, vos résultats et vos paramètres. Vous ne pourrez pas récupérer ces données.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-xl shadow-red-200 transition-all flex items-center justify-center"
              >
                {isDeleting ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Suppression...</> : "Oui, supprimer mon compte"}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
