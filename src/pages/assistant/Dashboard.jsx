import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointments';
import { patientService } from '@/services/patients';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatTime, formatDate, getStatusColor, getStatusLabel, cn } from '@/lib/utils';
import { Calendar, UserPlus, ClipboardList, Clock, Users, ChevronRight, Plus } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const AssistantDashboard = () => {
  useAuth();
  const { t } = useLanguage();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  // Auto-cancel expired planifie RDVs
  useEffect(() => {
    supabase.rpc('auto_cancel_past_rdv').catch(() => {});
  }, []);

  const { data: allAppointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: () => appointmentService.fetchAppointments({}),
    refetchInterval: 30000,
  });

  const { data: allPatients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.fetchPatients(),
  });

  const activeAppointments = allAppointments
    .filter(a => a.statut !== 'termine' && a.statut !== 'annule')
    .sort((a, b) => new Date(a.date_heure_debut) - new Date(b.date_heure_debut));

  const confirmedCount = allAppointments.filter(a => a.statut === 'confirme' && a.date_heure_debut >= startOfDay && a.date_heure_debut <= endOfDay).length;
  const pendingCount = allAppointments.filter(a => a.statut === 'planifie' && a.date_heure_debut >= startOfDay && a.date_heure_debut <= endOfDay).length;
  const cancelledCount = allAppointments.filter(a => a.statut === 'annule' && a.date_heure_debut >= startOfDay && a.date_heure_debut <= endOfDay).length;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('assistant_rdv_today')} value={loadingAppts ? '…' : allAppointments.filter(a => a.date_heure_debut >= startOfDay && a.date_heure_debut <= endOfDay).length} icon={Calendar} color="blue" />
        <StatCard title={t('assistant_confirmed')} value={loadingAppts ? '…' : confirmedCount} icon={ClipboardList} color="emerald" />
        <StatCard title={t('assistant_pending')} value={loadingAppts ? '…' : pendingCount} icon={Clock} color="amber" />
        <StatCard title={t('assistant_cancelled')} value={loadingAppts ? '…' : cancelledCount} icon={Users} color="red" />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{t('assistant_schedule')}</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Tous les rendez-vous</p>
            </div>
            <Link to="/receptionniste/calendar" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
              {t('view_calendar')} <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loadingAppts ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="h-10 w-20 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-slate-50 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : activeAppointments.length > 0 ? (
              activeAppointments.map((appt) => {
                const isGuestBooking = appt.motif?.includes('— Patient:');
                const guestNameMatch = appt.motif?.match(/Patient:\s*([^—-]+)/);
                const guestName = guestNameMatch ? guestNameMatch[1].trim() : (isGuestBooking ? appt.motif?.split('—')[1]?.replace('Patient:', '').trim() : 'Patient Externe');
                return (
                <div key={appt.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="text-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 min-w-[70px]">
                    <p className="text-[10px] text-slate-500 font-bold mb-0.5">{formatDate(new Date(appt.date_heure_debut))}</p>
                    <p className="text-sm font-extrabold text-primary tracking-tight">{formatTime(appt.date_heure_debut)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {appt.patient?.utilisateur?.prenom
                        ? `${appt.patient.utilisateur.prenom} ${appt.patient.utilisateur.nom}`
                        : guestName}
                    </p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {appt.patient?.utilisateur?.prenom
                        ? `${appt.motif || t('consultation')} • 📞 ${appt.patient.utilisateur.telephone || 'N/A'}`
                        : `🩺 ${appt.motif?.match(/\[(.*?)\]/)?.[1] || t('consultation')} • 📞 ${appt.motif?.match(/Tél:\s*([\d\s]+)/)?.[1]?.trim() || appt.motif?.split('—')[2]?.replace('Tél:', '').trim() || 'N/A'} `}
                    </p>
                  </div>
                  <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', getStatusColor(appt.statut))}>
                    {getStatusLabel(appt.statut)}
                  </span>
                </div>
              )})
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">{t('assistant_no_rdv')}</p>
              </div>
            )}
          </div>
        </div>
 
        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight mb-4">{t('assistant_quick_actions')}</h3>
            <div className="space-y-3">
              <Link to="/receptionniste/calendar" className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 hover:bg-primary/10 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-200">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{t('assistant_new_rdv')}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{t('assistant_new_rdv_hint')}</p>
                </div>
              </Link>
              <Link to="/receptionniste/patients" className="flex items-center gap-3 p-4 bg-teal-50/50 rounded-xl border border-teal-100/50 hover:bg-teal-50 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-teal-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-teal-200">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{t('assistant_new_patient')}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{t('assistant_new_patient_hint')}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">{t('assistant_recent_patients')}</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {allPatients.slice(0, 5).map((patient) => (
                <div key={patient.id} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    {patient.utilisateurs?.prenom?.[0] || patient.utilisateur?.prenom?.[0]}{patient.utilisateurs?.nom?.[0] || patient.utilisateur?.nom?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {patient.utilisateur?.prenom} {patient.utilisateur?.nom}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium truncate">{patient.utilisateur?.telephone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
