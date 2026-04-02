import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatDate, cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { FileText, Download, Image, Eye, Calendar, Stethoscope, Clock } from 'lucide-react';

export const PatientRecords = () => {
  const { user } = useAuth();

  const { data: patientRecord } = useQuery({
    queryKey: ['patient-record', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('patient').select('*').eq('utilisateur_id', user?.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['patient-exams', patientRecord?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('examen')
        .select(`
          *,
          service:service_id(*),
          images:image_radiologique(*),
          documents:document_medical(*, compte_rendu(*))
        `)
        .eq('patient_id', patientRecord?.id)
        .order('dateRealisation', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientRecord?.id,
  });

  const { data: dossier } = useQuery({
    queryKey: ['patient-dossier', patientRecord?.id],
    queryFn: async () => {
      const { data } = await supabase.from('dossier_medical').select('*').eq('patient_id', patientRecord?.id).single();
      return data;
    },
    enabled: !!patientRecord?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dossier Médical</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Consultez vos examens et résultats</p>
      </div>

      {/* Medical Summary */}
      {dossier && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-slate-800 mb-3">Résumé Médical</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dossier.antecedentsMedicaux && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Antécédents</p>
                <p className="text-sm text-slate-700 font-medium">{dossier.antecedentsMedicaux}</p>
              </div>
            )}
            {dossier.allergies && (
              <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">⚠️ Allergies</p>
                <p className="text-sm text-red-700 font-medium">{dossier.allergies}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exam List */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />)
        ) : exams.length > 0 ? (
          exams.map(exam => (
            <div key={exam.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="p-5 flex items-start gap-4 flex-wrap">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100 flex-shrink-0">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm font-bold text-slate-800">{exam.service?.nom || 'Examen'}</p>
                    <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', getStatusColor(exam.statut))}>
                      {getStatusLabel(exam.statut)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(exam.dateRealisation)}</span>
                    {exam.images?.length > 0 && (
                      <span className="flex items-center gap-1"><Image className="h-3 w-3" />{exam.images.length} images</span>
                    )}
                  </div>
                  {exam.observationsCliniques && (
                    <p className="text-sm text-slate-600 mt-2 font-medium">{exam.observationsCliniques}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center gap-3 flex-wrap">
                {exam.documents?.length > 0 && exam.documents.some(d => d.compte_rendu?.length > 0) && (
                  <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm">
                    <Eye className="h-3.5 w-3.5" /> Voir le Rapport
                  </button>
                )}
                {exam.documents?.length > 0 && (
                  <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Télécharger PDF
                  </button>
                )}
                {exam.images?.length > 0 && (
                  <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                    <Image className="h-3.5 w-3.5" /> Voir Images
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">Aucun examen trouvé</p>
            <p className="text-xs mt-1 font-medium">Vos résultats d'examen apparaîtront ici</p>
          </div>
        )}
      </div>
    </div>
  );
};
