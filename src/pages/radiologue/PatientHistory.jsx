import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { examService } from '@/services/exams';
import { formatDate, cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Search, User, Calendar, Stethoscope, FileText, Clock, AlertCircle } from 'lucide-react';

export const PatientHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const { data, error } = await supabase
        .from('patient')
        .select('*, utilisateur:utilisateur_id(nom, prenom, email, telephone)')
        .or(`utilisateur.nom.ilike.%${searchTerm}%,utilisateur.prenom.ilike.%${searchTerm}%`);
      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });

  const { data: patientExams = [], isLoading: loadingExams } = useQuery({
    queryKey: ['patient-history', selectedPatient?.id],
    queryFn: () => examService.fetchExams({ patientId: selectedPatient?.id }),
    enabled: !!selectedPatient?.id,
  });

  const { data: dossier } = useQuery({
    queryKey: ['dossier', selectedPatient?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossier_medical')
        .select('*')
        .eq('patient_id', selectedPatient.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!selectedPatient?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Historique Patient</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Recherchez un patient pour consulter son historique</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-sm font-medium transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {patients.length > 0 && !selectedPatient && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
            {patients.map(patient => (
              <button
                key={patient.id}
                onClick={() => { setSelectedPatient(patient); setSearchTerm(`${patient.utilisateur?.prenom} ${patient.utilisateur?.nom}`); }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {patient.utilisateur?.prenom?.[0]}{patient.utilisateur?.nom?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{patient.utilisateur?.prenom} {patient.utilisateur?.nom}</p>
                  <p className="text-xs text-slate-500 font-medium">{patient.utilisateur?.telephone}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPatient && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 lg:sticky lg:top-24 self-start">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {selectedPatient.utilisateur?.prenom?.[0]}{selectedPatient.utilisateur?.nom?.[0]}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{selectedPatient.utilisateur?.prenom} {selectedPatient.utilisateur?.nom}</p>
                <p className="text-sm text-slate-500 font-medium">{selectedPatient.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
              </div>
            </div>
            <button onClick={() => { setSelectedPatient(null); setSearchTerm(''); }} className="text-xs font-bold text-primary hover:underline">
              ← Changer de patient
            </button>

            {dossier && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {dossier.antecedentsMedicaux && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Antécédents</p>
                    <p className="text-sm text-slate-700 font-medium">{dossier.antecedentsMedicaux}</p>
                  </div>
                )}
                {dossier.allergies && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Allergies</p>
                    <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                      <AlertCircle className="h-4 w-4" /> {dossier.allergies}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Historique des Examens</h3>
            {loadingExams ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />)
            ) : patientExams.length > 0 ? (
              <div className="space-y-3">
                {patientExams.map((exam, i) => (
                  <div key={exam.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all relative">
                    {i < patientExams.length - 1 && <div className="absolute left-8 top-full h-3 w-0.5 bg-slate-200 z-0" />}
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100 flex-shrink-0">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-sm font-bold text-slate-800">{exam.service?.nom || 'Examen'}</p>
                          <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', getStatusColor(exam.statut))}>
                            {getStatusLabel(exam.statut)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(exam.dateRealisation)}</span>
                        </div>
                        {exam.observationsCliniques && (
                          <p className="text-sm text-slate-600 mt-2 font-medium">{exam.observationsCliniques}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center text-slate-400 font-semibold text-sm">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                Aucun examen trouvé pour ce patient
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
