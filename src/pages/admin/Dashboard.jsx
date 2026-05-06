import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { auditService } from '@/services/audit';
import { timeAgo } from '@/lib/utils';
import { Users, ClipboardList, Database, Shield, ChevronRight } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { t, lang } = useLanguage();
  const today = new Date();
  const startOf7DaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  // Unified Dashboard Metrics Query
  const { data: dashboardData, isLoading: loadingMetrics } = useQuery({
    queryKey: ['admin', 'dashboardMetrics'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('utilisateurs')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'patient');
      
      if (error) throw error;
      return { usersCount: count || 0 };
    }
  });

  const { usersCount = 0 } = dashboardData || {};

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <Users className="h-12 w-12 text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">{t('user_management')}</h3>
          <p className="text-sm text-slate-500 max-w-xs mt-2">Gérez les comptes des radiologues, réceptionnistes et administrateurs de la plateforme.</p>
          <Link to="/admin/users" className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
            {t('view_all_users')}
          </Link>
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
          <Link to="/admin/audit-logs" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
            {t('view_all')} <ChevronRight className="h-3 w-3" />
          </Link>
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
