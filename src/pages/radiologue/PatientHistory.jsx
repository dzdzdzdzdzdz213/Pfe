import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatDate, cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Search, User, Calendar, Stethoscope, FileText, Clock, AlertCircle, Activity, Droplets, Pill, ScrollText, Image, ChevronDown, ChevronUp, CheckCircle, Eye } from 'lucide-react';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { useLanguage } from '@/contexts/LanguageContext';

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------
const Tab = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
      active ? 'bg-primary text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
    )}
  >
    {children}
    {count !== undefined && (
      <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-black', active ? 'bg-white/20' : 'bg-slate-100')}>
        {count}
      </span>
    )}
  </button>
);

// ---------------------------------------------------------------------------
// Exam card with nested comptes_rendus and images
// ---------------------------------------------------------------------------
const ExamCard = ({ exam, onViewImages }) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const reports = exam.comptes_rendus || [];
  const images = exam.images_radiologiques || [];

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div
        className="flex items-start gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="h-10 w-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100 flex-shrink-0">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-bold text-slate-800">{exam.services?.nom || exam.service?.nom || t('exam_label')}</p>
            <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', getStatusColor(exam.statut))}>
              {getStatusLabel(exam.statut, t)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(exam.date_realisation)}</span>
            {images.length > 0 && <span className="flex items-center gap-1"><Image className="h-3 w-3" />{images.length} {t('img_short')}</span>}
            {reports.length > 0 && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{reports.length} {t('report_short')}</span>}
          </div>
          {exam.observations_cliniques && (
            <p className="text-xs text-slate-500 font-medium mt-1 truncate">{exam.observations_cliniques}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-50 p-4 space-y-3 bg-slate-50/30">
          {/* Images */}
          {images.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('radiological_images')}</p>
              <button
                onClick={() => onViewImages(exam.id)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all"
              >
                <Image className="h-3.5 w-3.5" /> {t('view_images_count').replace('{count}', images.length)}
              </button>
            </div>
          )}

          {/* Comptes Rendus */}
          {reports.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('comptes_rendus_label')}</p>
              <div className="space-y-2">
                {reports.map(cr => (
                  <div key={cr.id} className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border',
                    cr.est_valide ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'
                  )}>
                    {cr.est_valide
                      ? <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      : <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                    <span className={cn('text-xs font-bold flex-1', cr.est_valide ? 'text-emerald-700' : 'text-amber-700')}>
                      {cr.est_valide ? t('status_realise') : t('status_planifie')} — {formatDate(cr.date_creation)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Médicaux */}
          {exam.documents_medicaux?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('documents')}</p>
              <div className="space-y-1">
                {exam.documents_medicaux.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg">
                    <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-700 truncate">{doc.type_document || t('document_label')}</span>
                    <span className="text-[10px] text-slate-400 font-medium ml-auto">{formatDate(doc.date_creation)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const PatientHistory = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('examens');
  const [imageViewerExam, setImageViewerExam] = useState(null);

  // Search patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const { data, error } = await supabase
        .from('patients')
        .select('*, utilisateur:utilisateur_id(nom, prenom, email, telephone)')
        .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%`, { foreignTable: 'utilisateur' });
      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });

  // Full patient dossier query
  const { data: dossier } = useQuery({
    queryKey: ['full-dossier', selectedPatient?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers_medicaux')
        .select('groupe_sanguin, allergies, antecedents_medicaux')
        .eq('patient_id', selectedPatient.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!selectedPatient?.id,
  });

  // All examens via rendez_vous
  const { data: examens = [], isLoading: loadingExams } = useQuery({
    queryKey: ['patient-full-history', selectedPatient?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rendez_vous')
        .select(`
          id, date_heure_debut, motif, statut,
          examens:examen_id(
            id, date_realisation, statut, observations_cliniques,
            services:service_id(nom),
            comptes_rendus(id, description_detaillee, est_valide, date_creation),
            images_radiologiques(id, url_stockage, type_image, description),
            documents_medicaux(id, type_document, url_document, date_creation)
          )
        `)
        .eq('patient_id', selectedPatient.id)
        .order('date_heure_debut', { ascending: false });
      if (error) throw error;
      return (data || []).map(rv => rv.examens).filter(Boolean);
    },
    enabled: !!selectedPatient?.id,
  });

  // Ordonnances
  const { data: ordonnances = [] } = useQuery({
    queryKey: ['patient-ordonnances', selectedPatient?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordonnances')
        .select('*')
        .eq('patient_id', selectedPatient.id)
        .order('date_creation', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedPatient?.id,
  });

  const allReports = examens.flatMap(e => (e.comptes_rendus || []).map(cr => ({ ...cr, examService: e.services?.nom, examDate: e.date_realisation })));
  const validatedReports = allReports.filter(cr => cr.est_valide);
  const allDocs = examens.flatMap(e => (e.documents_medicaux || []).map(doc => ({ ...doc, examService: e.services?.nom })));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('history_title')}</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{t('history_subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder={t('patient_search_placeholder')}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-sm font-medium transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {patients.length > 0 && !selectedPatient && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
            {patients.map(patient => (
              <button
                key={patient.id}
                onClick={() => { setSelectedPatient(patient); setSearchTerm(`${patient.utilisateur?.prenom} ${patient.utilisateur?.nom}`); setActiveTab('examens'); }}
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Patient Identity + Medical Summary */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 self-start">
            {/* Identity Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {selectedPatient.utilisateur?.prenom?.[0]}{selectedPatient.utilisateur?.nom?.[0]}
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900">{selectedPatient.utilisateur?.prenom} {selectedPatient.utilisateur?.nom}</p>
                  <p className="text-xs text-slate-500 font-medium">{selectedPatient.sexe === 'M' ? t('gender_m') : t('gender_f')}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {selectedPatient.utilisateur?.telephone && (
                  <p className="text-slate-600 font-medium">📞 {selectedPatient.utilisateur.telephone}</p>
                )}
                {selectedPatient.utilisateur?.email && (
                  <p className="text-slate-600 font-medium truncate">✉️ {selectedPatient.utilisateur.email}</p>
                )}
                {selectedPatient.date_naissance && (
                  <p className="text-slate-600 font-medium">🎂 {formatDate(selectedPatient.date_naissance)}</p>
                )}
                {selectedPatient.adresse && (
                  <p className="text-slate-600 font-medium">📍 {selectedPatient.adresse}</p>
                )}
                {selectedPatient.telephone_urgence && (
                  <p className="text-rose-600 font-bold">🚨 {t('emergency_phone_short')}: {selectedPatient.telephone_urgence}</p>
                )}
              </div>
              <button
                onClick={() => { setSelectedPatient(null); setSearchTerm(''); }}
                className="text-xs font-bold text-primary hover:underline"
              >
                ← {t('change_patient')}
              </button>
            </div>

            {/* Medical Data */}
            {dossier && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('medical_data')}</h3>
                {dossier.groupe_sanguin && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <Droplets className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider">{t('blood_group')}</p>
                      <p className="text-lg font-black text-red-700">{dossier.groupe_sanguin}</p>
                    </div>
                  </div>
                )}
                {dossier.allergies && (
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">{t('allergies')}</p>
                    </div>
                    <p className="text-sm text-amber-700 font-medium">{dossier.allergies}</p>
                  </div>
                )}
                {dossier.antecedents_medicaux && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('history_medical')}</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{dossier.antecedents_medicaux}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Tabs with data */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tab Bar */}
            <div className="flex gap-2 flex-wrap">
              <Tab active={activeTab === 'examens'} onClick={() => setActiveTab('examens')} count={examens.length}>
                <Activity className="h-3.5 w-3.5" /> {t('exams')}
              </Tab>
              <Tab active={activeTab === 'rapports'} onClick={() => setActiveTab('rapports')} count={validatedReports.length}>
                <FileText className="h-3.5 w-3.5" /> {t('comptes_rendus_label')}
              </Tab>
              <Tab active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} count={allDocs.length}>
                <ScrollText className="h-3.5 w-3.5" /> {t('documents')}
              </Tab>
              <Tab active={activeTab === 'ordonnances'} onClick={() => setActiveTab('ordonnances')} count={ordonnances.length}>
                <Pill className="h-3.5 w-3.5" /> {t('ordonnances')}
              </Tab>
            </div>

            {/* Examens Tab */}
            {activeTab === 'examens' && (
              <div className="space-y-3">
                {loadingExams ? (
                  [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />)
                ) : examens.length > 0 ? (
                  examens.map(exam => (
                    <ExamCard key={exam.id} exam={exam} onViewImages={setImageViewerExam} />
                  ))
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center text-slate-400">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">{t('no_exams_patient')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Comptes Rendus Tab */}
            {activeTab === 'rapports' && (
              <div className="space-y-3">
                {allReports.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center text-slate-400">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">{t('no_reports_available')}</p>
                  </div>
                ) : allReports.map(cr => (
                  <div key={cr.id} className={cn('bg-white rounded-xl border shadow-sm p-5 space-y-3', cr.est_valide ? 'border-emerald-100' : 'border-slate-100')}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{cr.examService || 'Examen'}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{formatDate(cr.examDate || cr.date_creation)}</p>
                      </div>
                      {cr.est_valide ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                          <CheckCircle className="h-3.5 w-3.5" /> {t('status_realise')}
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">{t('status_planifie')}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-slate-50">
                      {cr.description_detaillee && (
                        <div
                          className="prose prose-sm max-w-none text-slate-600 flex-1 line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: cr.description_detaillee }}
                        />
                      )}
                      {cr.est_valide && (
                        <button 
                          onClick={() => window.print()} 
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                        >
                          <ScrollText className="h-3.5 w-3.5" /> {t('print_report_title')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-3">
                {allDocs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center text-slate-400">
                    <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">{t('no_docs_medical')}</p>
                  </div>
                ) : allDocs.map(doc => (
                  <div key={doc.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{doc.type_document || t('document_label')}</p>
                      <p className="text-xs text-slate-500 font-medium">{doc.examService} — {formatDate(doc.date_creation)}</p>
                    </div>
                    {doc.url_document && (
                      <a href={doc.url_document} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> {t('view')}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Ordonnances Tab */}
            {activeTab === 'ordonnances' && (
              <div className="space-y-3">
                {ordonnances.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center text-slate-400">
                    <Pill className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">{t('no_ordonnances_found')}</p>
                  </div>
                ) : ordonnances.map(ord => (
                  <div key={ord.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-violet-500" />
                        <p className="text-sm font-bold text-slate-800">{t('ordonnance_label')}</p>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{formatDate(ord.date_creation)}</p>
                    </div>
                    {ord.medicaments && (
                      <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl">
                        <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">{t('medications_label')}</p>
                        <p className="text-sm text-slate-700 font-medium whitespace-pre-line">{ord.medicaments}</p>
                      </div>
                    )}
                    {ord.notes_generales && (
                      <p className="text-xs text-slate-500 font-medium mt-2">{ord.notes_generales}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {imageViewerExam && (
        <ImageViewerModal
          examenId={imageViewerExam}
          onClose={() => setImageViewerExam(null)}
        />
      )}
    </div>
  );
};
