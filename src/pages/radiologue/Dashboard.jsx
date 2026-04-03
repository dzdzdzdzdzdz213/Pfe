import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { examService } from '@/services/exams';
import { reportService } from '@/services/reports';
import { formatDate, formatDateTime, cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Stethoscope, FileText, Clock, Users, ChevronRight, Activity } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';

export const RadiologueDashboard = () => {
  const { data: pendingExams = [] } = useQuery({
    queryKey: ['exams', 'pending'],
    queryFn: () => examService.fetchPendingExams(),
  });

  const { data: recentReports = [] } = useQuery({
    queryKey: ['reports', 'recent'],
    queryFn: async () => {
      const data = await reportService.fetchReports({ estValide: true });
      return (data || []).slice(0, 5);
    },
  });

  const { data: allExams = [] } = useQuery({
    queryKey: ['exams', 'all'],
    queryFn: () => examService.fetchExams(),
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayExams = allExams.filter(e => e.date_realisation?.startsWith(today));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Examens en attente" value={pendingExams.length} icon={Clock} color="amber" />
        <StatCard title="Examens du jour" value={todayExams.length} icon={Stethoscope} color="blue" />
        <StatCard title="Rapports validés" value={recentReports.length} icon={FileText} color="emerald" />
        <StatCard title="Total examens" value={allExams.length} icon={Activity} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Exams */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Examens en Attente</h3>
            <a href="/radiologue/examens" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
              Voir tout <ChevronRight className="h-3 w-3" />
            </a>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingExams.length > 0 ? pendingExams.slice(0, 5).map((exam) => (
              <div key={exam.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {exam.patient?.utilisateurs?.prenom || exam.rendez_vous?.patient?.utilisateurs?.prenom} {exam.patient?.utilisateurs?.nom || exam.rendez_vous?.patient?.utilisateurs?.nom}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">{exam.services?.nom} • {formatDate(exam.date_realisation || exam.dateRealisation)}</p>
                </div>
                <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', getStatusColor('planifie'))}>
                  En attente
                </span>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-400 font-semibold text-sm">Aucun examen en attente</div>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Rapports Récents</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {recentReports.length > 0 ? recentReports.map((report) => (
              <div key={report.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    Rapport #{report.id?.slice(0, 8)}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {report.radiologues?.utilisateurs?.prenom} {report.radiologues?.utilisateurs?.nom}
                  </p>
                </div>
                <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', report.est_valide ? getStatusColor('confirmed') : getStatusColor('pending'))}>
                  {report.est_valide ? 'Validé' : 'Brouillon'}
                </span>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-400 font-semibold text-sm">Aucun rapport récent</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
