import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { auditService } from '@/services/audit';
import { formatDate, formatDateTime, timeAgo } from '@/lib/utils';
import { Users, Calendar, Activity, FileText, ClipboardList, TrendingUp, Database, Shield, ChevronRight } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { useLanguage } from '@/contexts/LanguageContext';

export const AdminDashboard = () => {
  const { t, lang } = useLanguage();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const startOf7DaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  // Unified Dashboard Metrics Query
  const { data: dashboardData, isLoading: loadingMetrics } = useQuery({
    queryKey: ['admin', 'dashboardMetrics'],
    queryFn: async () => {
      const usersP = supabase.from('utilisateurs').select('*', { count: 'exact', head: true });
      const examsP = supabase.from('examens').select('*', { count: 'exact', head: true }).eq('statut', 'planifie');
      const reportsP = supabase.from('comptes_rendus').select('*', { count: 'exact', head: true }).eq('est_valide', true);
      const rdvP = supabase.from('rendez_vous').select('date_heure_debut').gte('date_heure_debut', startOf7DaysAgo).lte('date_heure_debut', endOfDay);

      const [usersRes, examsRes, reportsRes, rdvRes] = await Promise.all([usersP, examsP, reportsP, rdvP]);

      const rdvData = rdvRes.data || [];
      const chartDays = [];
      let todayCount = 0;

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();
        
        const count = rdvData.filter(r => {
          const t = new Date(r.date_heure_debut).getTime();
          return t >= dayStart && t <= dayEnd;
        }).length;
        
        if (i === 0) todayCount = count; // Today's count

        chartDays.push({ day: new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'fr', { weekday: 'short' }).format(d), count });
      }

      return {
        usersCount: usersRes.count || 0,
        pendingExams: examsRes.count || 0,
        weekReports: reportsRes.count || 0,
        todayAppointments: todayCount,
        weekData: chartDays
      };
    }
  });

  const { usersCount = 0, pendingExams = 0, weekReports = 0, todayAppointments = 0, weekData = [] } = dashboardData || {};
  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  const { data: recentLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['admin', 'recentLogs'],
    queryFn: async () => {
      const data = await auditService.fetchAuditLogs({});
      return (data || []).slice(0, 10);
    },
  });

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('total_users')} value={usersCount} icon={Users} color="blue" loading={loadingMetrics} />
        <StatCard title={t('appointments_today')} value={todayAppointments} icon={Calendar} color="emerald" loading={loadingMetrics} />
        <StatCard title={t('exams_pending')} value={pendingExams} icon={Activity} color="amber" loading={loadingMetrics} />
        <StatCard title={t('reports_validated')} value={weekReports} icon={FileText} color="violet" loading={loadingMetrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{t('appointments_7_days')}</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{t('recent_activity')}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-slate-300" />
          </div>
          <div className="flex items-end gap-3 h-48">
            {loadingMetrics ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse flex items-end gap-3 w-full h-full">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex-1 bg-slate-100 rounded-t-lg" style={{ height: `${Math.max(20, Math.random() * 100)}%` }} />
                  ))}
                </div>
              </div>
            ) : (
              weekData.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">{item.count}</span>
                  <div
                    className="w-full bg-primary/80 rounded-t-lg transition-all duration-500 hover:bg-primary min-h-[4px]"
                    style={{ height: `${(item.count / maxCount) * 160}px` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.day}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{t('system_status')}</h3>
            <Shield className="h-5 w-5 text-slate-300" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-slate-700">Supabase</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">{t('connected')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">{t('database')}</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">{t('operational')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">{t('storage')}</span>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">{t('active')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{t('recent_activity')}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{t('audit_log')}</p>
          </div>
          <a href="/admin/audit-logs" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
            {t('view_all')} <ChevronRight className="h-3 w-3" />
          </a>
        </div>
        <div className="divide-y divide-slate-50">
          {loadingLogs ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2"><div className="h-4 w-40 bg-slate-100 rounded animate-pulse" /><div className="h-3 w-60 bg-slate-50 rounded animate-pulse" /></div>
              </div>
            ))
          ) : recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{log.action}</p>
                  <p className="text-xs text-slate-500 font-medium truncate">{log.utilisateur?.prenom} {log.utilisateur?.nom} • {log.details || ''}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">{timeAgo(log.date_action, lang)}</span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 font-semibold text-sm">{t('no_activity')}</div>
          )}
        </div>
      </div>
    </div>
  );
};
