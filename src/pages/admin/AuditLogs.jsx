import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/audit';
import { DataTable } from '@/components/common/DataTable';
import { formatDateTime, cn } from '@/lib/utils';
import { Download, Filter, ClipboardList, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ACTION_COLORS = {
  login: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  logout: 'bg-slate-50 text-slate-600 border-slate-200',
  create: 'bg-blue-50 text-blue-700 border-blue-200',
  update: 'bg-amber-50 text-amber-700 border-amber-200',
  delete: 'bg-red-50 text-red-600 border-red-200',
};

export const AdminAuditLogs = () => {
  const { t, lang } = useLanguage();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [actionFilter, setActionFilter] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', dateRange, actionFilter],
    queryFn: () => auditService.fetchAuditLogs({
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
      action: actionFilter || undefined,
    }),
  });

  const exportCSV = () => {
    const headers = [t('date_label'), t('user_label'), t('action_label'), t('details_label')];
    const rows = logs.map(log => [
      formatDateTime(log.date_action),
      `${log.utilisateur?.prenom || ''} ${log.utilisateur?.nom || ''}`,
      log.action,
      log.details || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action) => {
    const key = Object.keys(ACTION_COLORS).find(k => action?.toLowerCase().includes(k));
    return ACTION_COLORS[key] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const columns = [
    {
      key: 'date_action', label: t('date_time_label'),
      render: (row) => <span className="text-sm font-semibold text-slate-700">{formatDateTime(row.date_action, lang)}</span>,
    },
    {
      key: 'user', label: t('user_label'),
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
            {row.utilisateur?.prenom?.[0]}{row.utilisateur?.nom?.[0]}
          </div>
          <span className="text-sm font-medium text-slate-700">{row.utilisateur?.prenom} {row.utilisateur?.nom}</span>
        </div>
      ),
    },
    {
      key: 'action', label: t('action_label'),
      render: (row) => (
        <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', getActionColor(row.action))}>
          {row.action}
        </span>
      ),
    },
    {
      key: 'details', label: t('details_label'),
      render: (row) => <span className="text-sm font-medium text-slate-500 truncate max-w-xs block">{row.details || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('audit_log_title')}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{t('n_entries').replace('{n}', logs.length)}</p>
        </div>
        <button onClick={exportCSV} className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
          <Download className="h-5 w-5" /> {t('export_csv')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('filter_date_from')}</label>
          <input type="date" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('filter_date_to')}</label>
          <input type="date" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('filter_action_type')}</label>
          <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="">{t('all')}</option>
            <option value="login">{t('action_type_login')}</option>
            <option value="create">{t('action_type_create')}</option>
            <option value="update">{t('action_type_update')}</option>
            <option value="delete">{t('action_type_delete')}</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={logs} loading={isLoading} searchPlaceholder={t('audit_search_placeholder')} />
    </div>
  );
};
