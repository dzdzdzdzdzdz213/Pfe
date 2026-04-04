import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Search, User, FileText, Image, Send, ChevronDown, ChevronUp, Loader2, CheckCircle, X, Upload, FilePlus, Filter } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

// ---------------------------------------------------------------------------
// Mock data for demo mode
// ---------------------------------------------------------------------------
const MOCK_PATIENTS = [
  {
    id: 'p1',
    utilisateur: { prenom: 'Amina', nom: 'Boukhelif', email: 'amina.boukhelif@example.com', telephone: '0551 234 567' },
    examens: [
      { id: 'e1', service: { nom: 'Scanner thoracique' }, dateRealisation: '2026-03-15T09:00:00Z', statut: 'completed',
        compte_rendu: { contenu: 'Absence de lésion parenchymateuse pulmonaire. Pas d\'épanchement pleural. Médiastin normal.', est_valide: true } },
      { id: 'e2', service: { nom: 'Radiographie du genou' }, dateRealisation: '2026-02-10T14:30:00Z', statut: 'completed',
        compte_rendu: null },
    ],
  },
  {
    id: 'p2',
    utilisateur: { prenom: 'Karim', nom: 'Meddah', email: 'karim.meddah@example.com', telephone: '0661 987 654' },
    examens: [
      { id: 'e3', service: { nom: 'Échographie abdominale' }, dateRealisation: '2026-03-28T11:00:00Z', statut: 'completed',
        compte_rendu: { contenu: 'Foie de taille et d\'échostructure normales. Vésicule biliaire bien visible sans calcul. Reins normaux.', est_valide: true } },
    ],
  },
  {
    id: 'p3',
    utilisateur: { prenom: 'Sara', nom: 'Cherif', email: 'sara.cherif@example.com', telephone: '0550 111 222' },
    examens: [],
  },
];

// ---------------------------------------------------------------------------
// Document type badge
// ---------------------------------------------------------------------------
const DocBadge = ({ type }) => {
  const { t } = useLanguage();
  const styles = {
    compte_rendu: 'bg-blue-50 text-blue-700 border-blue-200',
    image: 'bg-violet-50 text-violet-700 border-violet-200',
    resultat: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const labels = {
    compte_rendu: t('compte_rendu_label'),
    image: t('image_label'),
    resultat: t('result_label'),
  };
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold border', styles[type] || 'bg-slate-50 text-slate-600 border-slate-200')}>
      {labels[type] || type}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Send Document Modal
// ---------------------------------------------------------------------------
const SendDocModal = ({ patient, exam, onClose }) => {
  const { t } = useLanguage();
  const [docType, setDocType] = useState('compte_rendu');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error(t('error_missing_doc_content'));
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          utilisateur_id: patient.utilisateur_id,
          type: docType,
          contenu: message,
          lu: false,
          date_envoi: new Date().toISOString()
        });
      if (error) throw error;
      setSent(true);
      toast.success(t('doc_sent_success').replace('{name}', `${patient.utilisateur.prenom} ${patient.utilisateur.nom}`));
    } catch (err) {
      toast.error(err.message || 'Erreur envoi');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">{t('send_doc_title')}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              → {patient.utilisateur.prenom} {patient.utilisateur.nom}
              {exam && <span className="ml-2 text-slate-400">• {exam.service?.nom}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><X className="h-5 w-5" /></button>
        </div>

        {sent ? (
          <div className="p-10 text-center">
            <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">{t('doc_sent_title')}</h3>
            <p className="text-sm text-slate-500 font-medium">
              {t('doc_sent_hint').replace('{name}', `${patient.utilisateur.prenom} ${patient.utilisateur.nom}`)}
            </p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
              {t('close')}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Document Type */}
            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">{t('doc_type_label')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'compte_rendu', label: t('compte_rendu_label'), icon: FileText, color: 'blue' },
                  { value: 'image', label: t('image_label'), icon: Image, color: 'violet' },
                  { value: 'resultat', label: t('result_label'), icon: FilePlus, color: 'emerald' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDocType(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-xs font-bold',
                      docType === opt.value
                        ? opt.color === 'blue' ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : opt.color === 'violet' ? 'border-violet-400 bg-violet-50 text-violet-700'
                        : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    )}
                  >
                    <opt.icon className="h-5 w-5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing compte rendu preview */}
            {docType === 'compte_rendu' && exam?.compte_rendu && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 mb-2">{t('doc_existing_compte_rendu')} :</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{exam.compte_rendu.contenu}</p>
              </div>
            )}

            {/* Upload zone for images */}
            {docType === 'image' && (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
                <Upload className="h-8 w-8 text-slate-300 group-hover:text-primary mx-auto mb-2 transition-colors" />
                <p className="text-sm font-bold text-slate-500 group-hover:text-slate-700">{t('upload_drag_alt')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('upload_any_type_hint')}</p>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">
                {docType === 'compte_rendu' ? t('doc_note_optional') : t('doc_message_patient')}
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={docType === 'compte_rendu'
                  ? t('doc_note_placeholder')
                  : t('doc_message_placeholder')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none"
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {t('send_doc_btn')}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Patient Card
// ---------------------------------------------------------------------------
const PatientCard = ({ patient }) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [sendModal, setSendModal] = useState(null); // { patient, exam }

  // Extract exams safely from rendez_vous relationship
  const patientExams = patient.rendez_vous 
    ? patient.rendez_vous.map(rv => rv.examens).filter(Boolean)
    : patient.examens || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-50 border border-primary/10 flex items-center justify-center font-bold text-primary text-lg flex-shrink-0">
          {patient.utilisateur.prenom[0]}{patient.utilisateur.nom[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-extrabold text-slate-900">
            {patient.utilisateur.prenom} {patient.utilisateur.nom}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{patient.utilisateur.email} • {patient.utilisateur.telephone}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            {t('exam_count_alt').replace('{count}', patientExams.length)}
          </span>
          <button
            onClick={e => { e.stopPropagation(); setSendModal({ patient, exam: null }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold border border-primary/10 hover:border-primary transition-all"
          >
            <Send className="h-3.5 w-3.5" /> {t('send')}
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {/* Exams Accordion */}
      {expanded && (
        <div className="border-t border-slate-50 divide-y divide-slate-50">
          {patientExams.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold">{t('no_exams_registered')}</p>
            </div>
          ) : patientExams.map(exam => (
            <div key={exam.id} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="mt-0.5 h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-800">{exam.service?.nom || exam.services?.nom}</p>
                  <DocBadge type={exam.compte_rendu || exam.comptes_rendus?.length ? 'compte_rendu' : 'resultat'} />
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{formatDate(exam.dateRealisation || exam.date_realisation)}</p>
                {/* Handle both singular and plural nested compte rendus */}
                {(exam.compte_rendu || (exam.comptes_rendus && exam.comptes_rendus[0])) && (
                  <p className="text-xs text-slate-600 font-medium mt-2 bg-blue-50/50 border border-blue-100/50 px-3 py-2 rounded-xl leading-relaxed line-clamp-2">
                    {exam.compte_rendu?.contenu || exam.comptes_rendus[0]?.description_detaillee}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSendModal({ patient, exam })}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-primary text-blue-600 hover:text-white rounded-xl text-[11px] font-bold border border-blue-100 hover:border-primary transition-all"
              >
                <Send className="h-3 w-3" /> {t('send')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Send Modal */}
      {sendModal && (
        <SendDocModal
          patient={sendModal.patient}
          exam={sendModal.exam}
          onClose={() => setSendModal(null)}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const RadiologuePatientSearch = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();

  // Fetch services for filter dropdown
  const { data: services = [] } = useQuery({
    queryKey: ['services-list'],
    queryFn: async () => {
      const { data } = await supabase.from('services').select('id, nom');
      return data || [];
    },
  });

  const hasActiveFilters = dateFrom || dateTo || serviceFilter || statusFilter;

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['radiologue-patients', query, dateFrom, dateTo, serviceFilter, statusFilter],
    queryFn: async () => {
      if (user?.id?.startsWith('demo-')) {
        if (!query.trim()) return MOCK_PATIENTS;
        return MOCK_PATIENTS.filter(p =>
          `${p.utilisateur.prenom} ${p.utilisateur.nom} ${p.utilisateur.email}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );
      }

      let q = supabase.from('patients').select(`
        id,
        utilisateur:utilisateur_id(prenom, nom, email, telephone),
        rendez_vous(
           examens:examen_id(
             id, date_realisation, statut,
             services:service_id(id, nom),
             comptes_rendus(description_detaillee, est_valide)
           )
        )
      `);

      if (query.trim()) {
        q = q.or(`prenom.ilike.%${query}%,nom.ilike.%${query}%`, { foreignTable: 'utilisateur' });
      }

      const { data, error } = await q.limit(50);
      if (error) throw error;

      let result = data || [];

      // Client-side filtering by exam date/service/status
      if (dateFrom || dateTo || serviceFilter || statusFilter) {
        result = result.filter(patient => {
          const exams = (patient.rendez_vous || []).map(rv => rv.examens).filter(Boolean);
          return exams.some(exam => {
            const date = exam.date_realisation ? new Date(exam.date_realisation) : null;
            if (dateFrom && date && date < new Date(dateFrom)) return false;
            if (dateTo && date && date > new Date(dateTo + 'T23:59:59')) return false;
            if (serviceFilter && exam.services?.id !== serviceFilter) return false;
            if (statusFilter && exam.statut !== statusFilter) return false;
            return true;
          });
        });
      }

      return result.slice(0, 20);
    },
    placeholderData: [],
  });

  const clearFilters = () => {
    setDateFrom(''); setDateTo(''); setServiceFilter(''); setStatusFilter('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('patient_search')}</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {t('patient_search_subtitle')}
        </p>
      </div>

      {/* Search Box + Filter Toggle */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('patient_search_placeholder_alt')}
              className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary shadow-sm transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-2xl border font-bold text-sm transition-all shadow-sm',
              showFilters || hasActiveFilters
                ? 'bg-primary text-white border-primary'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <Filter className="h-4 w-4" />
            {t('filters')}
            {hasActiveFilters && <span className="h-2 w-2 bg-amber-400 rounded-full" />}
          </button>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">{t('filter_date_from')}</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">{t('filter_date_to')}</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">{t('service_label')}</label>
                <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">{t('all_services')}</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">{t('filter_status')}</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">{t('all_statuses')}</option>
                  <option value="planifie">{t('status_planifie')}</option>
                  <option value="en_cours">{t('status_en_cours')}</option>
                  <option value="completed">{t('status_termine')}</option>
                  <option value="annule">{t('status_annule')}</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
                <X className="h-3 w-3" /> {t('clear_filters')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      ) : patients.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            {t('patient_count_found').replace('{count}', patients.length)}
          </p>
          {patients.map(patient => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      ) : query || hasActiveFilters ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
          <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">{t('no_patient_found')}</p>
          <p className="text-xs font-medium mt-1">{t('search_modify_hint')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">{t('search_initial_hint')}</p>
        </div>
      )}
    </div>
  );
};

