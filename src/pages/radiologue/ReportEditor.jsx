import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { examService } from '@/services/exams';
import { reportService } from '@/services/reports';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDate, cn } from '@/lib/utils';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { FileUpload } from '@/components/common/FileUpload';
import {
  Save, CheckCircle, FileText, User, Calendar, Stethoscope,
  ZoomIn, ZoomOut, RotateCw, Loader2, ArrowLeft,
  Bold, Italic, List, ListOrdered, Heading2, Undo, Redo, Minus,
  Printer, Image as ImageIcon, Pill
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// ---------------------------------------------------------------------------
// TipTap Toolbar
// ---------------------------------------------------------------------------
const MenuBar = ({ editor }) => {
  const { t } = useLanguage();
  if (!editor) return null;
  const buttons = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), title: t('editor_bold') },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), title: t('editor_italic') },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading'), title: t('editor_heading') },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), title: t('editor_bullet_list') },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), title: t('editor_ordered_list') },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), active: false, title: t('editor_separator') },
    { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false, title: t('undo') },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false, title: t('redo') },
  ];
  return (
    <div className="flex items-center gap-1 p-2 border-b border-slate-100 flex-wrap bg-slate-50/50">
      {buttons.map((btn, i) => (
        <button key={i} onClick={btn.action} title={btn.title}
          className={cn('p-2 rounded-lg transition-colors', btn.active ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')}>
          <btn.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
};

const TEMPLATES = [
  { name: 'Normal', content: '<h2>Résultats</h2><p>L\'examen ne révèle aucune anomalie significative.</p><h2>Conclusion</h2><p>Examen dans les limites de la normale.</p>' },
  { name: 'Anomalie', content: '<h2>Résultats</h2><p>L\'examen met en évidence...</p><h2>Impression</h2><p></p><h2>Recommandations</h2><p>Un suivi est recommandé...</p>' },
  { name: 'Comparatif', content: '<h2>Comparaison</h2><p>Par rapport à l\'examen précédent du...</p><h2>Résultats</h2><p></p><h2>Conclusion</h2><p></p>' },
];

// ---------------------------------------------------------------------------
// Printable report DOM (hidden, used for window.print())
// ---------------------------------------------------------------------------
const PrintableReport = React.forwardRef(({ exam, reportContent, radiologue, isValidated }, ref) => {
  const { t, lang } = useLanguage();
  return (
    <div ref={ref} id="printable-report" className={cn('hidden print:block', lang === 'ar' ? 'font-arabic' : '')} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-report, #printable-report * { visibility: visible !important; }
          #printable-report { position: fixed; inset: 0; background: white; padding: 40px 50px; font-family: ${lang === 'ar' ? "'Amiri', serif" : "'Times New Roman', serif"}; font-size: 12px; line-height: 1.6; color: #111; }
          .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
          .print-clinic-name { font-size: 20px; font-weight: 700; color: #1e40af; }
          .print-clinic-sub { font-size: 11px; color: #64748b; }
          .print-patient-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .print-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
          .print-value { font-size: 12px; font-weight: 600; color: #1e293b; }
          .print-report-title { font-size: 16px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; }
          .print-content h2 { font-size: 13px; font-weight: 700; color: #1e40af; margin: 16px 0 6px; text-transform: uppercase; letter-spacing: 0.03em; }
          .print-content p { margin: 0 0 8px; }
          .print-content ul, .print-content ol { padding-left: 20px; margin-bottom: 8px; }
          .print-footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
          .print-stamp { border: 2px solid #16a34a; border-radius: 8px; padding: 10px 20px; color: #16a34a; font-weight: 700; text-align: center; font-size: 13px; }
          .print-signature { text-align: ${lang === 'ar' ? 'left' : 'right'}; }
          .print-signature-line { border-top: 1px solid #94a338; width: 200px; margin-top: 40px; padding-top: 4px; font-size: 11px; color: #64748b; }
          @page { margin: 0; }
        }
      `}</style>
      <div className="print-header">
        <div>
          <div className="print-clinic-name">🩻 {t('clinic_name')}</div>
          <div className="print-clinic-sub">{t('clinic_subtitle')}</div>
          <div className="print-clinic-sub">{t('clinic_address')} | {t('clinic_phone')}</div>
        </div>
        <div style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}>
          <div className="print-label">{t('print_date')}</div>
          <div className="print-value">{new Date().toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div className="print-patient-block">
        <div>
          <div className="print-label">{t('patient_label')}</div>
          <div className="print-value">{exam?.patient?.utilisateur?.prenom} {exam?.patient?.utilisateur?.nom}</div>
        </div>
        <div>
          <div className="print-label">{t('gender')}</div>
          <div className="print-value">{exam?.patient?.sexe === 'M' ? t('gender_m') : t('gender_f')}</div>
        </div>
        <div>
          <div className="print-label">{t('service_label')}</div>
          <div className="print-value">{exam?.service?.nom || exam?.services?.nom || '—'}</div>
        </div>
        <div>
          <div className="print-label">{t('date_label')}</div>
          <div className="print-value">{formatDate(exam?.date_realisation)}</div>
        </div>
        <div>
          <div className="print-label">{t('role_radiologue')}</div>
          <div className="print-value">Dr. {radiologue?.prenom} {radiologue?.nom}</div>
        </div>
      </div>

      <div className="print-report-title">{t('print_report_title')}</div>
      <div className="print-content" dangerouslySetInnerHTML={{ __html: reportContent }} />

      <div className="print-footer">
        {isValidated && (
          <div className="print-stamp">
            {t('print_validated')}<br />
            <span style={{ fontSize: '10px', fontWeight: 400 }}>{t('print_validated_hint')}</span>
          </div>
        )}
        <div className="print-signature">
          <div className="print-signature-line">
            {t('radiologue_signature')}<br />Dr. {radiologue?.prenom} {radiologue?.nom}
          </div>
        </div>
      </div>
    </div>
  );
});
PrintableReport.displayName = 'PrintableReport';

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const ReportEditor = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const queryClient = useQueryClient();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isValidated, setIsValidated] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [ordonnance, setOrdonnance] = useState({ description: '', nom_medecin_prescripteur: '' });

  const { data: exam, isLoading: loadingExam } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => examService.fetchExamById(id),
    enabled: !!id,
  });

  // Fetch radiologue profile for the print header and to get radiologue_id
  const { data: radioProfile } = useQuery({
    queryKey: ['radiologue-profile', utilisateur?.id],
    queryFn: async () => {
      if (!utilisateur?.id) return null;
      const { data, error } = await supabase
        .from('radiologues')
        .select('id, utilisateur_id, specialite_principale, utilisateurs(prenom, nom)')
        .eq('utilisateur_id', utilisateur.id)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching radiologue profile:", error);
        throw error;
      }
      return data;
    },
    enabled: !!utilisateur?.id,
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: t('report_content_default'),
    editorProps: { attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3' } },
  });

  // Load existing report if any
  useEffect(() => {
    if (exam?.comptes_rendus?.length > 0) {
      const existing = exam.comptes_rendus[0];
      if (editor && !editor.isDestroyed && (editor.getHTML() === '<p></p>' || editor.getHTML() === t('report_content_default'))) {
        editor.commands.setContent(existing.description_detaillee || '');
      }
      setReportId(existing.id);
      setIsValidated(existing.est_valide || false);
    }
    // Load existing ordonnance
    const fetchOrdonnance = async () => {
      const { data } = await supabase
        .from('ordonnances')
        .select('*')
        .eq('examen_id', id)
        .maybeSingle();
      if (data) {
        setOrdonnance({ description: data.description || '', nom_medecin_prescripteur: data.nom_medecin_prescripteur || '' });
      }
    };
    fetchOrdonnance();
  }, [exam, editor, id, t]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content = editor?.getHTML();
      
      // Save Report
      if (!radioProfile?.id) {
        toast.error("Impossible de sauvegarder : votre profil Radiologue n'est pas encore activé. Veuillez contacter l'administrateur.");
        return;
      }
      let report;
      if (reportId) {
        report = await reportService.updateReport(reportId, {
          description_detaillee: content,
          est_valide: isValidated,
        });
      } else {
        report = await reportService.createReport({
          description_detaillee: content,
          est_valide: isValidated,
          radiologue_id: radioProfile.id,
          examen_id: id 
        });
        if (report) setReportId(report.id);
      }
      
      // Save Ordonnance if content exists
      if (ordonnance.description.trim()) {
        const { error: ordError } = await supabase
          .from('ordonnances')
          .upsert({
            examen_id: id,
            description: ordonnance.description,
            nom_medecin_prescripteur: ordonnance.nom_medecin_prescripteur,
          }, { onConflict: 'examen_id' });
        
        if (ordError) throw ordError;
      }

      if (isValidated) await examService.updateExamStatus(id, 'termine');
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(isValidated ? t('report_validated') : t('report_saved'));
      if (isValidated) navigate('/radiologue/examens');
    },
    onError: (err) => toast.error(err.message),
  });

  const handlePrint = () => {
    window.print();
  };

  const applyTemplate = (template) => {
    editor?.commands.setContent(template.content);
    toast.info(t('template_applied').replace('{name}', template.name));
  };

  const images = exam?.images_radiologiques || exam?.images || [];

  const handleFileUploadComplete = async (uploadedFiles) => {
    try {
      const inserts = uploadedFiles.map(file => ({
        examen_id: id,
        url_stockage: file.url, // Store the full public URL so it renders correctly
        nom_fichier: file.name
      }));
      
      const { error } = await supabase.from('images_radiologiques').insert(inserts);
      if (error) throw error;
      
      toast.success('Fichiers enregistrés avec succès au dossier médical du patient !');
      queryClient.invalidateQueries({ queryKey: ['exam', id] });
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde des images : ' + err.message);
    }
  };

  if (loadingExam) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="h-10 w-10 border-b-2 border-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden Printable Report */}
      <PrintableReport
        exam={exam}
        reportContent={editor?.getHTML() || ''}
        radiologue={radioProfile}
        isValidated={isValidated}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/radiologue/examens')} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{t('report_editor_title')}</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {exam?.patient?.utilisateur?.prenom} {exam?.patient?.utilisateur?.nom} — {exam?.service?.nom || exam?.services?.nom}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Print / PDF button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <Printer className="h-4 w-4" /> {t('report_print')}
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('report_draft')}
          </button>
          <button
            onClick={() => { setIsValidated(true); saveMutation.mutate(); }}
            disabled={saveMutation.isPending}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-100 transition-colors"
          >
            <CheckCircle className="h-4 w-4" /> {t('report_validate')}
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Panel: Patient Info */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 lg:sticky lg:top-24">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('patient_info')}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {exam?.patient?.utilisateur?.prenom?.[0]}{exam?.patient?.utilisateur?.nom?.[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{exam?.patient?.utilisateur?.prenom} {exam?.patient?.utilisateur?.nom}</p>
                <p className="text-xs text-slate-500 font-medium">{exam?.patient?.sexe === 'M' ? t('gender_m') : t('gender_f')}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">{formatDate(exam?.date_realisation)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">{exam?.service?.nom || exam?.services?.nom}</span>
              </div>
              {radioProfile && (
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium">Dr. {radioProfile.prenom} {radioProfile.nom}</span>
                </div>
              )}
            </div>
          </div>
          {exam?.observations_cliniques && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('report_observations')}</p>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{exam.observations_cliniques}</p>
            </div>
          )}
          
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Pill className="h-4 w-4 text-violet-500" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('ordonnance_label')}</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">{t('description') || 'Description'}</label>
                <textarea 
                  value={ordonnance.description}
                  onChange={(e) => setOrdonnance(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Paracétamol 500mg, 1 tab x 3/jour..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all min-h-[100px] resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">{t('nom_medecin_prescripteur') || 'Médecin'}</label>
                <textarea 
                  value={ordonnance.nom_medecin_prescripteur}
                  onChange={(e) => setOrdonnance(prev => ({ ...prev, nom_medecin_prescripteur: e.target.value }))}
                  placeholder={t('ordonnance_notes_placeholder')}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all min-h-[60px] resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel: Image Viewer */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('radiological_images')}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ZoomOut className="h-4 w-4" /></button>
              <span className="text-xs font-bold text-slate-500 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ZoomIn className="h-4 w-4" /></button>
              <button onClick={() => setRotation(r => r + 90)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><RotateCw className="h-4 w-4" /></button>
              {images.length > 0 && (
                <button
                  onClick={() => setImageViewerOpen(true)}
                  className="ml-2 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                >
                  <ImageIcon className="h-3.5 w-3.5" /> {t('view')}
                </button>
              )}
            </div>
          </div>
          <div className="bg-slate-900 min-h-[400px] flex items-center justify-center overflow-hidden relative">
            {images.length > 0 ? (
              <img
                src={images[0]?.signedUrl || images[0]?.url_stockage || ''}
                alt="Radiology"
                className="max-w-full max-h-[500px] object-contain transition-transform duration-300 cursor-zoom-in"
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                onClick={() => setImageViewerOpen(true)}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="text-center text-slate-500 p-8">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">{t('image_viewer_none')}</p>
                <p className="text-xs opacity-60 mt-1">{t('image_viewer_hint')}</p>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="p-3 border-t border-slate-100 flex gap-2 overflow-x-auto bg-slate-50/50">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImageViewerOpen(true)}
                  className="h-16 w-16 rounded-lg border-2 border-slate-200 overflow-hidden flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="h-full w-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">IMG {i + 1}</div>
                </button>
              ))}
            </div>
          )}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Ajouter des images supplémentaires</h4>
            <FileUpload 
              bucket="exam-images"
              folder={id}
              onUploadComplete={handleFileUploadComplete}
              multiple={true}
            />
          </div>
        </div>

        {/* Right Panel: TipTap Editor */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:sticky lg:top-24">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('report_content')}</span>
            <div className="relative group">
              <button className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">
                {t('report_template')} ▾
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => applyTemplate(t)}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl transition-colors">
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <MenuBar editor={editor} />
          <div className="max-h-[500px] overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isValidated} onChange={(e) => setIsValidated(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-500 accent-emerald-500" />
              <span className="text-xs font-bold text-slate-600">{t('report_final')}</span>
            </label>
            <span className="text-[10px] text-slate-400 font-semibold">Auto-save: 30s</span>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {imageViewerOpen && (
        <ImageViewerModal
          examenId={id}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </div>
  );
};
