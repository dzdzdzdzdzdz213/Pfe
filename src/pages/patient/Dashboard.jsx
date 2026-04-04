import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { appointmentService } from '@/services/appointments';
import { formatDate, formatTime, cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Calendar, FileText, Bell, User, ChevronRight, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: patientRecord } = useQuery({
    queryKey: ['patient-record', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*, utilisateurs!inner(nom, prenom, email)')
        .eq('utilisateur_id', user?.id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null; // no row
        throw error;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', patientRecord?.id],
    queryFn: () => appointmentService.fetchAppointments({ patientId: patientRecord?.id }),
    enabled: !!patientRecord?.id,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['patient-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').eq('utilisateur_id', user?.id).order('date_envoi', { ascending: false }).limit(5);
      if (error) {
        if (error.code) return [];
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  const upcomingAppointments = appointments.filter(a => new Date(a.date_heure_debut || a.dateHeureDebut) > new Date() && a.statut !== 'cancelled');
  
  const prenom = patientRecord?.utilisateurs?.prenom || patientRecord?.utilisateur?.prenom || 'Patient';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-60 w-60 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <p className="text-blue-200 font-bold text-xs sm:text-sm tracking-wide">{t('welcome_back')} 👋</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">{prenom}</h1>
          <p className="text-blue-100/80 mt-2 text-xs sm:text-sm font-medium max-w-md">
            {t('patient_dashboard_desc')}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/patient/appointments" className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{t('prendre_rdv')}</p>
            <p className="text-xs text-slate-500 font-medium">{t('reserve_online')}</p>
          </div>
        </a>
        <a href="/patient/records" className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-teal-100">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{t('my_results')}</p>
            <p className="text-xs text-slate-500 font-medium">{t('consult_reports')}</p>
          </div>
        </a>
        <a href="/patient/profile" className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-violet-100">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{t('my_profile')}</p>
            <p className="text-xs text-slate-500 font-medium">{t('manage_info')}</p>
          </div>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{t('upcoming_appointments')}</h3>
            <a href="/patient/appointments" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">{t('view_all')} <ChevronRight className="h-3 w-3" /></a>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingAppointments.length > 0 ? upcomingAppointments.slice(0, 3).map(appt => (
              <div key={appt.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="text-center bg-primary/5 rounded-xl px-3 py-2 border border-primary/10 min-w-[70px]">
                  <p className="text-sm font-extrabold text-primary">{formatTime(appt.date_heure_debut || appt.dateHeureDebut)}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{formatDate(appt.date_heure_debut || appt.dateHeureDebut)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{appt.motif || 'Consultation'}</p>
                </div>
                <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', getStatusColor(appt.statut))}>
                  {getStatusLabel(appt.statut)}
                </span>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">{t('no_upcoming_appointments')}</p>
                <a href="/patient/appointments" className="text-xs font-bold text-primary hover:underline mt-1 inline-block">{t('book_appointment_now')} →</a>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Notifications</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {notifications.length > 0 ? notifications.map(notif => (
              <div key={notif.id} className={`px-6 py-4 hover:bg-slate-50/50 transition-colors ${!notif.lu ? 'bg-blue-50/20' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${!notif.lu ? 'bg-primary' : 'bg-slate-200'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{notif.contenu}</p>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">{formatDate(notif.date_envoi)}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-400">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">{t('notifications_none')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
