import React from 'react';

const getColorClasses = (color) => {
  const mapping = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };
  return mapping[color] || mapping.blue;
};

export const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle, loading = false }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        {loading ? (
          <div className="h-9 w-16 bg-slate-100 rounded animate-pulse mt-2" />
        ) : (
          <p className="text-2xl sm:text-3xl font-extrabold mt-2 text-slate-900 tracking-tight">{value}</p>
        )}
        {subtitle && <p className="text-[10px] sm:text-xs font-bold text-emerald-600 mt-1">{subtitle}</p>}
      </div>
      <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border ${getColorClasses(color)}`}>
        {Icon && <Icon className="h-6 w-6 sm:h-7 sm:h-7" />}
      </div>
    </div>
  </div>
);
