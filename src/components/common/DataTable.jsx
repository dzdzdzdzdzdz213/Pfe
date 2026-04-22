import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  Search, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export const DataTable = ({ 
  columns, 
  data, 
  loading = false, 
  searchPlaceholder = "Rechercher...",
  onRowClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Flatten nested objects so search works on fields like utilisateur.nom, utilisateur.prenom, etc.
  const flattenValues = (obj) => {
    if (!obj) return [String(obj ?? '')];
    if (obj instanceof Date) return [obj.toISOString(), formatDate(obj)];
    if (typeof obj !== 'object') return [String(obj)];
    return Object.values(obj).flatMap(flattenValues);
  };

  const filteredData = useMemo(() => {
    let result = [...data];
    
    if (searchTerm.trim()) {
      const searchWords = searchTerm.toLowerCase().trim().split(/\s+/);
      
      result = result.filter((row) => {
        const rowValues = flattenValues(row).map(v => 
          v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        );
        
        // Every word in the search term must match at least one value in the row
        return searchWords.every(word => {
          const normalizedWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return rowValues.some(val => val.includes(normalizedWord));
        });
      });
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="h-10 w-64 bg-slate-100 animate-pulse rounded-lg" />
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="h-12 bg-slate-50 border-b border-slate-200" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-slate-100 last:border-0 bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key}
                    className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest pointer-events-auto"
                  >
                    <div 
                      className={cn(
                        "flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors",
                        column.sortable === false && "cursor-default hover:text-slate-500"
                      )}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      {column.label}
                      {column.sortable !== false && (
                        <div className="flex flex-col">
                          {sortConfig.key === column.key ? (
                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {currentData.length > 0 ? (
                currentData.map((row, i) => (
                  <tr 
                    key={i} 
                    className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 text-sm truncate max-w-[200px]">
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Aucun résultat trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500 font-bold">
            Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredData.length)} sur {filteredData.length} résultats
          </p>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={cn(
                  "h-10 w-10 rounded-xl text-sm font-bold transition-all",
                  currentPage === i + 1 
                    ? "bg-primary text-white shadow-lg shadow-blue-200" 
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
