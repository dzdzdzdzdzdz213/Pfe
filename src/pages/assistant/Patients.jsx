import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '@/services/patients';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { toast } from 'sonner';
import { UserPlus, X, Edit, Trash2, Eye, Phone, Mail, MapPin, Loader2, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export const AssistantPatients = () => {
  const { t } = useLanguage();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.fetchPatients(),
  });

  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', telephone: '', adresse: '', sexe: 'M', date_naissance: '', groupeSanguin: '', telephoneUrgence: ''
  });

  const resetForm = () => {
    setFormData({ nom: '', prenom: '', email: '', telephone: '', adresse: '', sexe: 'M', date_naissance: '', groupeSanguin: '', telephoneUrgence: '' });
  };

  const createMutation = useMutation({
    mutationFn: () => patientService.createPatient(
      { adresse: formData.adresse, sexe: formData.sexe, date_naissance: formData.date_naissance, groupeSanguin: formData.groupeSanguin, telephoneUrgence: formData.telephoneUrgence },
      { nom: formData.nom, prenom: formData.prenom, email: formData.email, telephone: formData.telephone, role: 'patient' }
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success(t('patient_save_success'));
      setShowAddDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  
  const editMutation = useMutation({
    mutationFn: () => patientService.updatePatient(
      selectedPatient.id,
      { adresse: formData.adresse, groupe_sanguin: formData.groupeSanguin, date_naissance: formData.date_naissance },
      selectedPatient.utilisateur_id,
      { nom: formData.nom, prenom: formData.prenom, telephone: formData.telephone }
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success(t('patient_updated_success'));
      setShowAddDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (patient) => patientService.deletePatient(patient.id, patient.utilisateur_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success(t('patient_delete_success') || 'Patient supprimé');
      setShowDeleteConfirm(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const columns = [
    {
      key: 'name',
      label: t('last_name'),
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {row.utilisateur?.prenom?.[0]}{row.utilisateur?.nom?.[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{row.utilisateur?.prenom} {row.utilisateur?.nom}</p>
            <p className="text-xs text-slate-500 font-medium">{row.sexe === 'M' ? t('gender_m') : t('gender_f')}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'telephone',
      label: t('phone'),
      render: (row) => <span className="text-sm font-medium">{row.utilisateur?.telephone || '-'}</span>,
    },
    {
      key: 'email',
      label: t('login_email'),
      render: (row) => <span className="text-sm font-medium text-slate-500">{row.utilisateur?.email || '-'}</span>,
    },
    {
      key: 'date_naissance',
      label: t('dob'),
      render: (row) => <span className="text-sm font-medium">{row.date_naissance ? formatDate(row.date_naissance) : '-'}</span>,
    },
    {
      key: 'actions',
      label: t('actions'),
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setSelectedPatient(row); setShowDetailDialog(true); }} className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors" title={t('view')}>
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title={t('edit')}>
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setSelectedPatient(row); setShowDeleteConfirm(true); }} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title={t('delete')}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const openEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      nom: patient.utilisateur?.nom || '',
      prenom: patient.utilisateur?.prenom || '',
      email: patient.utilisateur?.email || '',
      telephone: patient.utilisateur?.telephone || '',
      adresse: patient.adresse || '',
      sexe: patient.sexe || 'M',
      date_naissance: patient.date_naissance || '',
      groupeSanguin: patient.groupeSanguin || '',
      telephoneUrgence: patient.telephoneUrgence || '',
    });
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('patients_mgmt_title')}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{patients.length} patient{patients.length !== 1 ? 's' : ''} enregistré{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { resetForm(); setSelectedPatient(null); setShowAddDialog(true); }}
          className="px-5 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          {t('assistant_new_patient')}
        </button>
      </div>

      <DataTable columns={columns} data={patients} loading={isLoading} searchPlaceholder={t('search_patient_placeholder')} />

      {/* Add/Edit Patient Dialog */}
      {showAddDialog && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddDialog(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-extrabold text-slate-900">{selectedPatient ? t('edit_patient') : t('assistant_new_patient')}</h2>
              <button onClick={() => setShowAddDialog(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('first_name')} *</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.prenom} onChange={e => setFormData(p => ({ ...p, prenom: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('last_name')} *</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.nom} onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('phone')} *</label>
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.telephone} onChange={e => setFormData(p => ({ ...p, telephone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('login_email')}</label>
                <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('dob')} *</label>
                  <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.date_naissance} onChange={e => setFormData(p => ({ ...p, date_naissance: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('gender')} *</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.sexe} onChange={e => setFormData(p => ({ ...p, sexe: e.target.value }))}>
                    <option value="M">{t('gender_m')}</option>
                    <option value="F">{t('gender_f')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('address')}</label>
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.adresse} onChange={e => setFormData(p => ({ ...p, adresse: e.target.value }))} />
              </div>
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('records_blood_type')}</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" placeholder="A+, B-, O+..." value={formData.groupeSanguin} onChange={e => setFormData(p => ({ ...p, groupeSanguin: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('phone_emergency')}</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.telephoneUrgence} onChange={e => setFormData(p => ({ ...p, telephoneUrgence: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button onClick={() => setShowAddDialog(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">{t('cancel')}</button>
              <button 
                onClick={() => selectedPatient ? editMutation.mutate() : createMutation.mutate()} 
                disabled={createMutation.isPending || editMutation.isPending} 
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100"
              >
                {(createMutation.isPending || editMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {selectedPatient ? t('update') : t('save')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Dialog */}
      {showDetailDialog && selectedPatient && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailDialog(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">{t('patient_details_title')}</h2>
              <button onClick={() => setShowDetailDialog(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {selectedPatient.utilisateur?.prenom?.[0]}{selectedPatient.utilisateur?.nom?.[0]}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{selectedPatient.utilisateur?.prenom} {selectedPatient.utilisateur?.nom}</p>
                  <p className="text-sm text-slate-500 font-medium">{selectedPatient.sexe === 'M' ? t('gender_m') : t('gender_f')} • {selectedPatient.date_naissance ? formatDate(selectedPatient.date_naissance) : 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-slate-400" /><span className="font-medium">{selectedPatient.utilisateur?.telephone || '-'}</span></div>
                <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-slate-400" /><span className="font-medium">{selectedPatient.utilisateur?.email || '-'}</span></div>
                <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-slate-400" /><span className="font-medium">{selectedPatient.adresse || '-'}</span></div>
              </div>
              {selectedPatient.groupeSanguin && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider">{t('records_blood_type')}</p>
                  <p className="text-lg font-bold text-red-600 mt-0.5">{selectedPatient.groupeSanguin}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => selectedPatient && deleteMutation.mutate(selectedPatient)}
        title={t('patient_delete_title')}
        description={t('patient_delete_desc')}
        variant="destructive"
        confirmText={t('delete')}
      />
    </div>
  );
};
