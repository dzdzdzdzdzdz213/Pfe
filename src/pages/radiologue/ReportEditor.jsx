import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Save, CheckCircle, FileText, User, Calendar, Stethoscope,
  ZoomIn, ZoomOut, RotateCw, Loader2, ArrowLeft, Download,
  Bold, Italic, List, ListOrdered, Heading2, Undo, Redo, Minus
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;
  const buttons = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading') },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), active: false },
    { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false },
  ];

  return (
    <div className="flex items-center gap-1 p-2 border-b border-slate-100 flex-wrap bg-slate-50/50">
      {buttons.map((btn, i) => (
        <button key={i} onClick={btn.action} className={cn('p-2 rounded-lg transition-colors', btn.active ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')}>
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

export const ReportEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isValidated, setIsValidated] = useState(false);

  const { data: exam, isLoading: loadingExam } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => examService.fetchExamById(id),
    enabled: !!id,
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<h2>Résultats</h2><p></p><h2>Impression</h2><p></p><h2>Recommandations</h2><p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!editor) return;
    const interval = setInterval(() => {
      console.log('Auto-saving report draft...');
    }, 30000);
    return () => clearInterval(interval);
  }, [editor]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content = editor?.getHTML();
      const report = await reportService.createReport({
        description_detaillee: content,
        est_valide: isValidated,
        radiologue_id: user?.id,
      });
      if (isValidated) {
        await examService.updateExamStatus(id, 'completed');
      }
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(isValidated ? 'Rapport validé et finalisé' : 'Brouillon enregistré');
      if (isValidated) navigate('/radiologue/examens');
    },
    onError: (err) => toast.error(err.message),
  });

  const applyTemplate = (template) => {
    editor?.commands.setContent(template.content);
    toast.info(`Modèle "${template.name}" appliqué`);
  };

  const images = exam?.images || [];
  const currentImage = images[selectedImageIndex];

  if (loadingExam) {
    return <div className="h-96 flex items-center justify-center"><div className="h-10 w-10 border-b-2 border-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/radiologue/examens')} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Rédaction de Compte-Rendu</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {exam?.patient?.utilisateur?.prenom} {exam?.patient?.utilisateur?.nom} — {exam?.service?.nom}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Brouillon
          </button>
          <button onClick={() => { setIsValidated(true); saveMutation.mutate(); }} disabled={saveMutation.isPending} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-100 transition-colors">
            <CheckCircle className="h-4 w-4" /> Valider & Finaliser
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Panel: Patient Info */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 lg:sticky lg:top-24">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informations Patient</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {exam?.patient?.utilisateur?.prenom?.[0]}{exam?.patient?.utilisateur?.nom?.[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{exam?.patient?.utilisateur?.prenom} {exam?.patient?.utilisateur?.nom}</p>
                <p className="text-xs text-slate-500 font-medium">{exam?.patient?.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600"><Calendar className="h-3.5 w-3.5 text-slate-400" /> <span className="font-medium">{formatDate(exam?.dateRealisation)}</span></div>
              <div className="flex items-center gap-2 text-slate-600"><Stethoscope className="h-3.5 w-3.5 text-slate-400" /> <span className="font-medium">{exam?.service?.nom}</span></div>
            </div>
          </div>

          {exam?.observationsCliniques && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Observations Cliniques</p>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{exam.observationsCliniques}</p>
            </div>
          )}
        </div>

        {/* Center Panel: Image Viewer */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Images Radiologiques</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ZoomOut className="h-4 w-4" /></button>
              <span className="text-xs font-bold text-slate-500 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ZoomIn className="h-4 w-4" /></button>
              <button onClick={() => setRotation(r => r + 90)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><RotateCw className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="bg-slate-900 min-h-[400px] flex items-center justify-center overflow-hidden relative">
            {images.length > 0 ? (
              <img
                src={`${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/exam-images/${currentImage?.chemin || ''}`}
                alt="Radiological Image"
                className="max-w-full max-h-[500px] object-contain transition-transform duration-300"
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%23334155" width="200" height="200"/><text fill="%2394a3b8" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14">Image non disponible</text></svg>'; }}
              />
            ) : (
              <div className="text-center text-slate-500 p-8">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">Aucune image disponible</p>
                <p className="text-xs opacity-60 mt-1">Les images seront affichées ici</p>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="p-3 border-t border-slate-100 flex gap-2 overflow-x-auto bg-slate-50/50">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImageIndex(i)} className={cn('h-16 w-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all', i === selectedImageIndex ? 'border-primary shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100')}>
                  <div className="h-full w-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">IMG {i + 1}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: TipTap Editor */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:sticky lg:top-24">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Compte-Rendu</span>
            <div className="relative group">
              <button className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">
                Modèles ▾
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => applyTemplate(t)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl transition-colors">
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
              <input type="checkbox" checked={isValidated} onChange={(e) => setIsValidated(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-500 accent-emerald-500" />
              <span className="text-xs font-bold text-slate-600">Marquer comme final</span>
            </label>
            <span className="text-[10px] text-slate-400 font-semibold">Auto-save: 30s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
