import React, { useEffect } from 'react';
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

  // Auto-cancel past RDVs on load
  useEffect(() => {
    const runMaintenance = async () => {
      try {
        const { error } = await supabase.rpc('auto_cancel_past_rdv');
        if (error) throw error;
      } catch (e) {
        console.warn('Auto-maintenance failed:', e);
      }
    };
    runMaintenance();
  }, []);
  const today = new Date();
  const startOf7DaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  // Unified Dashboard Metrics Query
  const { data: dashboardData, isLoading: loadingMetrics } = useQuery({
    queryKey: ['admin', 'dashboardMetrics'],
    queryFn: async () => {
      const { count, error: countErr } = await supabase
        .from('utilisateurs')
        .select('*', { count: 'exact', head: true });
      
      const { data: recentStaff, error: staffErr } = await supabase
        .from('utilisateurs')
        .select('id, nom, prenom, role, profil_complet')
        .neq('role', 'patient')
        .order('date_creation_compte', { ascending: false })
        .limit(6);

      if (countErr) throw countErr;
      if (staffErr) throw staffErr;
      
      return { 
        usersCount: count || 0,
        recentStaff: recentStaff || []
      };
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
        {/* Staff List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{t('staff_members') || 'Membres du Personnel'}</h3>
            <Link to="/admin/users" className="text-xs font-bold text-primary hover:underline">{t('view_all')}</Link>
          </div>
          <div className="flex-1 divide-y divide-slate-50">
            {loadingMetrics ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-full" />
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                </div>
              ))
            ) : (dashboardData?.recentStaff || []).length > 0 ? (
              dashboardData.recentStaff.map(staff => (
                <div key={staff.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
                      {staff.prenom?.[0]}{staff.nom?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{staff.prenom} {staff.nom}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{staff.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${staff.profil_complet ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {staff.profil_complet ? 'Actif' : 'Incomplet'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-400 text-sm font-medium">Aucun personnel trouvé</div>
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
