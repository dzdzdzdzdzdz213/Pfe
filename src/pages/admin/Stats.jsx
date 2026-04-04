import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, CheckCircle, Loader2, BarChart2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const SectionCard = ({ title, icon: Icon, children, loading }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{title}</h3>
    </div>
    {loading ? (
      <div className="h-48 flex items-center justify-center text-slate-400">
        <Loader2 className="h-7 w-7 animate-spin text-primary/40" />
      </div>
    ) : children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs font-bold">
      <p className="text-slate-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export const AdminStats = () => {
  const { t, lang } = useLanguage();
  const [period, setPeriod] = useState(6); // months

  // Monthly RDV trend
  const { data: monthlyData = [], isLoading: loadingMonthly } = useQuery({
    queryKey: ['stats-monthly', period],
    queryFn: async () => {
      const months = [];
      for (let i = period - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const { count } = await supabase
          .from('rendez_vous')
          .select('*', { count: 'exact', head: true })
          .gte('date_heure_debut', start)
          .lte('date_heure_debut', end);
        months.push({
          mois: d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'fr-FR', { month: 'short', year: '2-digit' }),
          rdv: count || 0,
        });
      }
      return months;
    },
  });

  // Exams by service
  const { data: serviceData = [], isLoading: loadingServices } = useQuery({
    queryKey: ['stats-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('examens')
        .select('service_id, services:service_id(nom)');
      if (error) throw error;
       const counts = {};
      (data || []).forEach(e => {
        const nom = e.services?.nom || t('unknown');
        counts[nom] = (counts[nom] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  // Validation rate
  const { data: validationStats, isLoading: loadingValidation } = useQuery({
    queryKey: ['stats-validation'],
    queryFn: async () => {
      const [{ count: total }, { count: validated }] = await Promise.all([
        supabase.from('comptes_rendus').select('*', { count: 'exact', head: true }),
        supabase.from('comptes_rendus').select('*', { count: 'exact', head: true }).eq('est_valide', true),
      ]);
      const rate = total > 0 ? Math.round((validated / total) * 100) : 0;
      return { total: total || 0, validated: validated || 0, rate };
    },
  });

  // Most active radiologues
  const { data: radioStats = [], isLoading: loadingRadio } = useQuery({
    queryKey: ['stats-radiologues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comptes_rendus')
        .select('radiologue_id, utilisateurs:radiologue_id(prenom, nom)');
      if (error) throw error;
      const counts = {};
      const names = {};
      (data || []).forEach(cr => {
        const id = cr.radiologue_id;
        if (!id) return;
        counts[id] = (counts[id] || 0) + 1;
        names[id] = `${t('dr_prefix')} ${cr.utilisateurs?.prenom || ''} ${cr.utilisateurs?.nom || ''}`.trim();
      });
      return Object.entries(counts)
        .map(([id, rapports]) => ({ name: names[id] || id, rapports }))
        .sort((a, b) => b.rapports - a.rapports)
        .slice(0, 5);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('stats_analyses')}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{t('stats_subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {[3, 6, 12].map(m => (
            <button
              key={m}
              onClick={() => setPeriod(m)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${period === m ? 'bg-primary text-white border-primary shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {t('n_months').replace('{n}', m)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('total_appointments'), value: monthlyData.reduce((s, m) => s + m.rdv, 0), color: 'blue' },
          { label: t('exams_label'), value: serviceData.reduce((s, d) => s + d.value, 0), color: 'violet' },
          { label: t('reports_validated'), value: validationStats?.validated ?? '—', color: 'emerald' },
          { label: t('validation_rate'), value: `${validationStats?.rate ?? 0}%`, color: 'amber' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{kpi.label}</p>
            <p className={`text-3xl font-black text-${kpi.color}-600`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <SectionCard title={t('monthly_rdv_trend')} icon={TrendingUp} loading={loadingMonthly}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="rdv" name={t('appointments_label')} stroke="#2563eb" strokeWidth={2.5}
                dot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#2563eb' }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Exams by Service */}
        <SectionCard title={t('exams_by_service')} icon={PieIcon} loading={loadingServices}>
          {serviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={serviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {serviceData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-bold">{t('no_exams_registered')}</div>
          )}
        </SectionCard>

        {/* Validation Rate */}
        <SectionCard title={t('reports_validation_rate')} icon={CheckCircle} loading={loadingValidation}>
          {validationStats && (
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-5xl font-black text-emerald-600">{validationStats.rate}%</p>
                  <p className="text-xs text-slate-500 font-bold mt-1">{t('reports_validated_on_total').replace('{total}', validationStats.total)}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
                    <CheckCircle className="h-3.5 w-3.5" /> {t('n_validated').replace('{n}', validationStats.validated)}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-xs font-bold">
                    {t('n_pending').replace('{n}', validationStats.total - validationStats.validated)}
                  </div>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                  style={{ width: `${validationStats.rate}%` }}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* Most Active Radiologues */}
        <SectionCard title={t('most_active_radiologues')} icon={BarChart2} loading={loadingRadio}>
          {radioStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={radioStats} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rapports" name={t('comptes_rendus_label')} fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-bold">{t('no_active_radiologue')}</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
