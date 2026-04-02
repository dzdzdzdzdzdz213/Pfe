import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Bell, Lock, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const ProfileSettings = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    system: true
  });

  const getRoleColor = (r) => {
    switch (r) {
      case 'administrateur': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'radiologue': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'receptionniste': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'patient': return 'text-slate-600 bg-slate-50 border-slate-200';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Vos modifications ont été enregistrées avec succès', {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      });
    }, 1000);
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
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{user?.email?.split('@')[0].toUpperCase()}</h1>
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
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Identifiant (Email)</label>
                <input 
                  type="text" 
                  disabled 
                  value={user?.email || ''} 
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
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
                {isSaving ? 'Enregistrement...' : <><Save className="h-4 w-4 mr-2" /> Enregistrer</>}
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
            </div>

          </div>
        )}
      </motion.div>
    </div>
  );
};
