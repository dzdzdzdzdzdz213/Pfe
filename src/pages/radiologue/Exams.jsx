import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { examService } from '@/services/exams';
import { DataTable } from '@/components/common/DataTable';
import { formatDate, cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Play, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealTime } from '@/hooks/useRealTime';

export const RadiologueExams = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => examService.fetchExams(),
  });

  // Subscribe to INSERT and UPDATE only for patient safety and data integrity
  useRealTime('examens', ['exams'], { event: ['INSERT', 'UPDATE'] });

  const filteredExams = statusFilter === 'all' ? exams : exams.filter(e => e.statut === statusFilter);

  const columns = [
    {
      key: 'patient', label: t('patient_label'),
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {row.patient?.utilisateur?.prenom?.[0]}{row.patient?.utilisateur?.nom?.[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{row.patient?.utilisateur?.prenom} {row.patient?.utilisateur?.nom}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'service', label: t('service_label'),
      render: (row) => <span className="text-sm font-medium">{row.service?.nom || '-'}</span>,
    },
    {
      key: 'date', label: t('date_label'),
      render: (row) => <span className="text-sm font-medium">{formatDate(row.dateRealisation)}</span>,
    },
    {
      key: 'observations', label: t('report_observations'),
      render: (row) => <span className="text-sm font-medium text-slate-500 truncate max-w-[200px] block">{row.observationsCliniques || '-'}</span>,
    },
    {
      key: 'statut', label: t('status'),
      render: (row) => (
        <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', getStatusColor(row.statut))}>
          {getStatusLabel(row.statut, t)}
        </span>
      ),
    },
    {
      key: 'actions', label: t('actions'), sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.statut === 'pending' && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/radiologue/report/${row.id}`); }} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5" /> {t('draft_report')}
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); navigate(`/radiologue/report/${row.id}`); }} className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors" title={t('view')}>
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('exam_queue_title')}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{t('exam_count').replace('{count}', filteredExams.length)}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[{ key: 'all', label: t('all') }, { key: 'pending', label: t('status_planifie') }, { key: 'completed', label: t('status_termine') }].map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)} className={cn('px-4 py-2 rounded-xl text-sm font-bold transition-all', statusFilter === f.key ? 'bg-primary text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filteredExams} loading={isLoading} searchPlaceholder={t('search_exam_placeholder')} />
    </div>
  );
};
