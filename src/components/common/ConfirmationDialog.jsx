import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default' // 'default' | 'destructive'
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const displayTitle = title || t('confirm');
  const displayDesc = description || t('confirm_default_desc');
  const displayConfirm = confirmText || t('confirm');
  const displayCancel = cancelText || t('cancel');

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                variant === 'destructive' 
                  ? 'bg-red-50 text-red-600 border border-red-100' 
                  : 'bg-blue-50 text-primary border border-blue-100'
              }`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{displayTitle}</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">{displayDesc}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors flex-shrink-0 -mt-1 -mr-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex gap-3 p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors text-sm"
            >
              {displayCancel}
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-colors text-sm text-white shadow-lg ${
                variant === 'destructive'
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-100'
                  : 'bg-primary hover:bg-blue-700 shadow-blue-100'
              }`}
            >
              {displayConfirm}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
