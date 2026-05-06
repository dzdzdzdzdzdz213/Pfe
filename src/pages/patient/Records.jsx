import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatDate, cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { FileText, Image, Eye, Calendar, Stethoscope, Printer, CheckCircle, X } from 'lucide-react';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealTime } from '@/hooks/useRealTime';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

const handleFileDownload = async (url, filename) => {
  const toastId = toast.loading('Téléchargement en cours...');
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.success('Téléchargement terminé', { id: toastId });
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Erreur lors du téléchargement', { id: toastId });
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
};
const PrintableReport = ({ exam, report, patientName, t, lang }) => (
  <div id="print-patient-report" className="hidden">
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #print-patient-report, #print-patient-report * { visibility: visible !important; }
        #print-patient-report { position: fixed; inset: 0; background: white; padding: 40px 50px; font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.6; color: #111; }
        .pr-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
        .pr-clinic { font-size: 20px; font-weight: 700; color: #1e40af; }
        .pr-sub { font-size: 10px; color: #64748b; }
        .pr-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .pr-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
        .pr-value { font-size: 12px; font-weight: 600; color: #1e293b; }
        .pr-title { font-size: 15px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px; }
        .pr-content h2 { font-size: 13px; font-weight: 700; color: #1e40af; margin: 14px 0 6px; text-transform: uppercase; }
        .pr-content p { margin: 0 0 8px; }
        .pr-stamp { display: inline-block; border: 2px solid #16a34a; border-radius: 8px; padding: 8px 20px; color: #16a34a; font-weight: 700; font-size: 13px; margin-top: 32px; }
        @page { margin: 0; }
      }
    `}</style>
    <div className="pr-header">
      <div>
        <div className="pr-clinic">🩻 {t('clinic_name')}</div>
        <div className="pr-sub">{t('clinic_subtitle')}</div>
        <div className="pr-sub">{t('clinic_address')}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="pr-label">{t('print_date')}</div>
        <div className="pr-value">{new Date().toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ')}</div>
      </div>
    </div>
    <div className="pr-block">
      <div><div className="pr-label">{t('role_patient')}</div><div className="pr-value">{patientName}</div></div>
      <div><div className="pr-label">{t('booking_service')}</div><div className="pr-value">{exam?.service?.nom || exam?.services?.nom || '—'}</div></div>
      <div><div className="pr-label">{t('date_realisation')}</div><div className="pr-value">{formatDate(exam?.date_realisation)}</div></div>
      <div><div className="pr-label">{t('modal_status')}</div><div className="pr-value">{report?.est_valide ? `✓ ${t('validate')}` : t('status_en_cours')}</div></div>
    </div>
    <div className="pr-title">{t('print_report_title').toUpperCase()}</div>
    <div className="pr-content" dangerouslySetInnerHTML={{ __html: report?.description_detaillee || `<p>${t('report_none_available')}</p>` }} />
    {report?.est_valide && <div className="pr-stamp">✓ {t('print_validated').toUpperCase()}</div>}
  </div>
);

// ---------------------------------------------------------------------------
// Report Viewer Modal
// ---------------------------------------------------------------------------
const ReportModal = ({ report, exam, patientName, onClose, t }) => {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">{t('print_report_title')}</h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
              {exam?.service?.nom || exam?.services?.nom} — {formatDate(exam?.date_realisation)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const element = document.getElementById('report-modal-content');
                const opt = {
                  margin: 10,
                  filename: `Compte_Rendu_${exam?.service?.nom || 'Examen'}.pdf`,
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                html2pdf().set(opt).from(element).save();
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
            >
              <Printer className="h-4 w-4" /> {t('report_download') || 'Télécharger PDF'}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-white" id="report-modal-content">
          {/* Professional Header for Preview */}
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('role_patient')}</p>
              <p className="text-sm font-bold text-slate-800">{patientName}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('booking_service')}</p>
              <p className="text-sm font-bold text-slate-800">{exam?.service?.nom || exam?.services?.nom}</p>
            </div>
          </div>

          <div
            className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: report?.description_detaillee || `<p class="text-slate-400 italic font-medium">${t('no_content_available')}</p>` }}
          />
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Standalone Documents (Linked to dossier but no exam)
// ---------------------------------------------------------------------------
const StandaloneDocuments = ({ dossierId, t, onViewReport }) => {
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['standalone-docs', dossierId],
    queryFn: async () => {
      // Fetch documents and try to join with comptes_rendus if it's a report
      const { data } = await supabase
        .from('documents_medicaux')
        .select(`
          *,
          comptes_rendus (
            id,
            description_detaillee,
            est_valide,
            examen:examen_id (
              services:service_id (nom),
              date_realisation
            )
          )
        `)
        .eq('dossier_id', dossierId)
        .order('date_creation', { ascending: false });
      return data || [];
    },
    enabled: !!dossierId,
  });

  if (!isLoading && docs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FileText className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-extrabold text-slate-800">{t('records_other_docs') || 'Documents Médicaux'}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {isLoading ? (
          [1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)
        ) : (
          docs.map(doc => {
            const isReport = doc.type === 'compte_rendu';
            const reportData = doc.comptes_rendus?.[0];
            const examData = reportData?.examen;

            return (
              <div key={doc.id} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 transition-colors">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">
                    {examData?.services?.nom || t('document_label') || 'Document'} — {new Date(doc.date_creation).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.statut || 'Terminé'}</p>
                </div>
                {isReport ? (
                  <button
                    onClick={() => onViewReport({ report: reportData, exam: examData })}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                  >
                    {t('view') || 'Voir'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleFileDownload(doc.chemin_fichier, `Document_${new Date(doc.date_creation).toLocaleDateString()}.pdf`)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                  >
                    {t('view') || 'Télécharger'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


export const PatientRecords = () => {
  const { utilisateur } = useAuth();
  const { t, lang } = useLanguage();
  const [activeReport, setActiveReport] = useState(null); // {report, exam}
  const [activeImageExam, setActiveImageExam] = useState(null);
  const [printTarget, setPrintTarget] = useState(null); // {report, exam}

  // Fetch patient row
  const { data: patientRecord } = useQuery({
    queryKey: ['patient-record', utilisateur?.id],
    queryFn: async () => {
      if (!utilisateur?.id) return null;
      const { data } = await supabase.from('patients').select('*').eq('utilisateur_id', utilisateur.id).single();
      return data;
    },
    enabled: !!utilisateur?.id,
  });

  // Fetch patient info for print
  const patientUser = utilisateur;

  // Fetch dossier medical
  const { data: dossier } = useQuery({
    queryKey: ['patient-dossier', patientRecord?.id],
    queryFn: async () => {
      const { data } = await supabase.from('dossiers_medicaux').select('*').eq('patient_id', patientRecord?.id).maybeSingle();
      return data;
    },
    enabled: !!patientRecord?.id,
  });

  // Fetch all validated comptes_rendus linked via rendez_vous → examens
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['patient-exams-records', patientRecord?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rendez_vous')
        .select(`
          id,
          date_heure_debut,
          motif,
          statut,
          examens:examens(
            id,
            date_realisation,
            statut,
            services:services(nom),
            comptes_rendus(id, description_detaillee, est_valide, document_medical_id),
            images_radiologiques(id, resolution, type_support, format_fichier, url_stockage, type_image, description),
            documents_medicaux(id, chemin_fichier, statut, date_creation, type)
          )
        `)
        .eq('patient_id', patientRecord?.id)
        .order('date_heure_debut', { ascending: false });
      if (error) throw error;
      return (data || []);
    },
    enabled: !!patientRecord?.id,
  });

  // Real-time updates for patient records
  useRealTime('rendez_vous', ['patient-exams-records', patientRecord?.id]);
  useRealTime('examens', ['patient-exams-records', patientRecord?.id]);
  useRealTime('comptes_rendus', ['patient-exams-records', patientRecord?.id]);
  useRealTime('documents_medicaux', ['patient-exams-records', patientRecord?.id]);

  const handlePrint = (report, exam) => {
    setPrintTarget({ report, exam });
    setTimeout(() => window.print(), 100);
  };

  const patientName = `${patientUser?.prenom || ''} ${patientUser?.nom || ''}`.trim();

  return (
    <div className="space-y-6">
      {/* Hidden Printable */}
      {printTarget && (
        <PrintableReport
          exam={printTarget.exam}
          report={printTarget.report}
          patientName={patientName}
          t={t}
          lang={lang}
        />
      )}

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('records_title')}</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{t('records_subtitle')}</p>
      </div>

      {/* Medical Summary */}
      {dossier && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-slate-800 mb-3">{t('records_medical_summary')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {dossier.groupe_sanguin && (
              <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 text-center">
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">{t('records_blood_type')}</p>
                <p className="text-2xl font-black text-red-700">{dossier.groupe_sanguin}</p>
              </div>
            )}
            {dossier.antecedents_medicaux && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('records_antecedents')}</p>
                <p className="text-sm text-slate-700 font-medium">{dossier.antecedents_medicaux}</p>
              </div>
            )}
            {dossier.allergies && (
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">⚠️ {t('records_allergies')}</p>
                <p className="text-sm text-amber-700 font-medium">{dossier.allergies}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standalone Documents Section */}
      {dossier && (
        <StandaloneDocuments 
          dossierId={dossier.id} 
          t={t} 
          onViewReport={(payload) => setActiveReport(payload)}
        />
      )}

      {/* Exam List */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />)
        ) : exams.length > 0 ? (
          exams.map(rv => {
            const exam = Array.isArray(rv.examens) ? rv.examens[0] : rv.examens;
            const validatedReports = exam?.comptes_rendus?.filter(cr => cr.est_valide) || [];
            const hasImages = exam?.images_radiologiques?.length > 0;

            return (
              <div key={rv.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="p-5 flex items-start gap-4 flex-wrap">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100 flex-shrink-0">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-bold text-slate-800">{exam?.services?.nom || t('exams')}</p>
                      <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', getStatusColor(exam?.statut || rv.statut))}>
                        {getStatusLabel(exam?.statut || rv.statut)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(rv.date_heure_debut)}</span>
                      {hasImages && <span className="flex items-center gap-1"><Image className="h-3 w-3" />{exam.images_radiologiques.length} {t('images')}</span>}
                      {rv.motif && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{rv.motif}</span>}
                    </div>

                    {/* Validated reports */}
                    {validatedReports.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {validatedReports.map(cr => (
                          <div key={cr.id} className="flex items-center gap-2 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span className="text-xs font-bold text-emerald-700 flex-1">{t('records_validated_report')}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveReport({ report: cr, exam })}
                                className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                              >
                                <Eye className="h-3.5 w-3.5" /> {t('view')}
                              </button>
                              <button
                                onClick={() => handlePrint(cr, exam)}
                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                              >
                                <Printer className="h-3.5 w-3.5" /> {t('records_pdf')}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* General Documents (from Radiologue Send) */}
                    {exam?.documents_medicaux?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {exam.documents_medicaux.map(doc => (
                          <div key={doc.id} className="flex items-center gap-2 p-3 bg-blue-50/30 border border-blue-100 rounded-xl">
                            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="text-xs font-bold text-slate-600 flex-1 truncate">Document Médical — {formatDate(doc.date_creation)}</span>
                             <div className="flex items-center gap-2">
                               {doc.type === 'compte_rendu' ? (
                                 <button
                                   onClick={() => {
                                     // Find the associated text report in the cr array if it exists
                                     const cr = exam.comptes_rendus?.find(r => r.document_medical_id === doc.id) || 
                                                exam.comptes_rendus?.[0]; // Fallback to first if link is old
                                     setActiveReport({ report: cr, exam });
                                   }}
                                   className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                                 >
                                   <Eye className="h-3.5 w-3.5" /> {t('view')}
                                 </button>
                               ) : (
                                 <button
                                   onClick={() => handleFileDownload(doc.chemin_fichier, `Document_${exam?.service?.nom || 'Examen'}.pdf`)}
                                   className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                                 >
                                   <Eye className="h-3.5 w-3.5" /> {t('view') || 'Télécharger'}
                                 </button>
                               )}
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Image preview strip */}
                {hasImages && (
                  <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center gap-3">
                    <button
                      onClick={() => setActiveImageExam(exam.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      <Image className="h-3.5 w-3.5" /> {t('records_images').replace('{count}', exam.images_radiologiques.length)}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">{t('records_no_exams')}</p>
            <p className="text-xs mt-1 font-medium">{t('records_no_exams_hint')}</p>
          </div>
        )}
      </div>

      {/* Report Viewer Modal */}
      {activeReport && (
        <ReportModal
          report={activeReport.report}
          exam={activeReport.exam}
          patientName={patientName}
          onClose={() => setActiveReport(null)}
          t={t}
          lang={lang}
        />
      )}

      {/* Image Viewer Modal */}
      {activeImageExam && (
        <ImageViewerModal
          examenId={activeImageExam}
          onClose={() => setActiveImageExam(null)}
        />
      )}
    </div>
  );
};
