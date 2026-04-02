import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { auditService } from '@/services/audit';
import { formatDate, formatDateTime, timeAgo } from '@/lib/utils';
import { Users, Calendar, Activity, FileText, ClipboardList, TrendingUp, Database, Shield, ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-extrabold mt-2 text-slate-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs font-bold text-emerald-600 mt-1">{subtitle}</p>}
      </div>
      <div className={`h-14 w-14 rounded-2xl bg-${color}-50 text-${color}-600 border border-${color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon className="h-7 w-7" />
      </div>
    </div>
  </div>
);

export const AdminDashboard = () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()).toISOString();

  const { data: usersCount = 0 } = useQuery({
    queryKey: ['admin', 'usersCount'],
    queryFn: async () => {
      const { count } = await supabase.from('utilisateur').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: todayAppointments = 0 } = useQuery({
    queryKey: ['admin', 'todayAppointments'],
    queryFn: async () => {
      const { count } = await supabase.from('rendez_vous').select('*', { count: 'exact', head: true }).gte('dateHeureDebut', startOfDay).lte('dateHeureDebut', endOfDay);
      return count || 0;
    },
  });

  const { data: pendingExams = 0 } = useQuery({
    queryKey: ['admin', 'pendingExams'],
    queryFn: async () => {
      const { count } = await supabase.from('examen').select('*', { count: 'exact', head: true }).eq('statut', 'pending');
      return count || 0;
    },
  });

  const { data: weekReports = 0 } = useQuery({
    queryKey: ['admin', 'weekReports'],
    queryFn: async () => {
      const { count } = await supabase.from('compte_rendu').select('*', { count: 'exact', head: true }).eq('est_valide', true);
      return count || 0;
    },
  });

  const { data: recentLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['admin', 'recentLogs'],
    queryFn: async () => {
      const data = await auditService.fetchAuditLogs({});
      return (data || []).slice(0, 10);
    },
  });

  // Compute a simple 7-day appointment chart
  const { data: weekData = [] } = useQuery({
    queryKey: ['admin', 'weekChart'],
    queryFn: async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
        const { count } = await supabase.from('rendez_vous').select('*', { count: 'exact', head: true }).gte('dateHeureDebut', dayStart).lte('dateHeureDebut', dayEnd);
        days.push({ day: new Intl.DateTimeFormat('fr', { weekday: 'short' }).format(d), count: count || 0 });
      }
      return days;
    },
  });

  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Utilisateurs" value={usersCount} icon={Users} color="blue" />
        <StatCard title="RDV Aujourd'hui" value={todayAppointments} icon={Calendar} color="emerald" />
        <StatCard title="Examens en attente" value={pendingExams} icon={Activity} color="amber" />
        <StatCard title="Rapports Validés" value={weekReports} icon={FileText} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Rendez-vous (7 jours)</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Activité récente</p>
            </div>
            <TrendingUp className="h-5 w-5 text-slate-300" />
          </div>
          <div className="flex items-end gap-3 h-48">
            {weekData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-600">{item.count}</span>
                <div
                  className="w-full bg-primary/80 rounded-t-lg transition-all duration-500 hover:bg-primary min-h-[4px]"
                  style={{ height: `${(item.count / maxCount) * 160}px` }}
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">État Système</h3>
            <Shield className="h-5 w-5 text-slate-300" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-slate-700">Supabase</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Connecté</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">Base de données</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Opérationnel</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Stockage</span>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">Actif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Activité Récente</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Journal d'audit</p>
          </div>
          <a href="/admin/audit-logs" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
            Voir tout <ChevronRight className="h-3 w-3" />
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
                <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">{timeAgo(log.date_action)}</span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 font-semibold text-sm">Aucune activité récente</div>
          )}
        </div>
      </div>
    </div>
  );
};
