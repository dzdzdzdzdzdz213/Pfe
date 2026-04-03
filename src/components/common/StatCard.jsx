import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color, subtitle, loading = false }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        {loading ? (
          <div className="h-9 w-16 bg-slate-100 rounded animate-pulse mt-2" />
        ) : (
          <p className="text-3xl font-extrabold mt-2 text-slate-900 tracking-tight">{value}</p>
        )}
        {subtitle && <p className="text-xs font-bold text-emerald-600 mt-1">{subtitle}</p>}
      </div>
      <div className={`h-14 w-14 rounded-2xl bg-${color}-50 text-${color}-600 border border-${color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {Icon && <Icon className="h-7 w-7" />}
      </div>
    </div>
  </div>
);
