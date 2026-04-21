import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointments';
import { patientService } from '@/services/patients';
import { consentementService } from '@/services/consentements';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { X, Search, UserPlus, Loader2, ChevronRight, Check, ShieldAlert, FileText, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr, arDZ } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/common/FileUpload';
import { useLanguage } from '@/contexts/LanguageContext';

export const AppointmentModal = ({ isOpen, onClose, appointment = null, selectedSlot = null }) => {
  const { user, utilisateur } = useAuth();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const isEditing = !!appointment;
  const [step, setStep] = useState(isEditing ? 4 : 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    patient_id: appointment?.patient_id || '',
    service_id: appointment?.service_id || '',
    date_heure_debut: appointment?.date_heure_debut || (selectedSlot ? selectedSlot.start.toISOString() : ''),
    date_heure_fin: appointment?.date_heure_fin || (selectedSlot ? selectedSlot.end.toISOString() : ''),
    motif: appointment?.motif || '',
    statut: appointment?.statut || 'planifie',
  });

  // Consent form state
  const [isInvasive, setIsInvasive] = useState(false);
  const [typeActeInvasif, setTypeActeInvasif] = useState('');

  const [newPatientForm, setNewPatientForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', sexe: 'M', date_naissance: '', adresse: ''
  });

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.fetchPatients(),
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      return data;
    }
  });

  const filteredPatients = patients.filter(p => {
    const name = `${p.utilisateur?.prenom} ${p.utilisateur?.nom} ${p.utilisateur?.telephone || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const selectedPatient = patients.find(p => p.id === formData.patient_id);
  const selectedService = services.find(s => s.id === formData.service_id);

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: (data) => appointmentService.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(t('modal_created'));
      onClose();
    },
    onError: (err) => toast.error(err.message || t('error_generic')),
  });

  // Update appointment mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentService.updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(t('modal_updated'));
      onClose();
    },
    onError: (err) => toast.error(err.message || t('error_generic')),
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id) => appointmentService.cancelAppointment(id, t('cancelled_by_assistant')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(t('appointments_cancel_success'));
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = async () => {
    if ((!isEditing && !formData.patient_id) || !formData.date_heure_debut) {
      toast.error(t('error_required_fields'));
      return;
    }
    if (isInvasive && !typeActeInvasif.trim()) {
      toast.error(t('error_invasive_type'));
      return;
    }

    if (isEditing) {
      const updateData = { ...formData };
      delete updateData.service_id; // service_id goes on 'examens' not 'rendez_vous'
      if (updateData.patient_id === '') updateData.patient_id = null;
      updateMutation.mutate({ id: appointment.id, data: updateData });
      return;
    }

    try {
      // 1. Create examen first so we can link the consentement
      let examenId = null;
      if (formData.service_id) {
        const { data: examen, error: exEr } = await supabase
          .from('examens')
          .insert({
            service_id: formData.service_id,
            statut: 'planifie',
            date_realisation: formData.date_heure_debut,
          })
          .select('id')
          .single();
        if (exEr) throw exEr;
        examenId = examen.id;
      }

      // 2. Create rendez_vous
      const { data: recepData } = await supabase
        .from('receptionnistes')
        .select('id')
        .eq('utilisateur_id', utilisateur?.id)
        .maybeSingle();
      const receptionniste_id = recepData?.id || null;

      const rdvData = {
        patient_id: formData.patient_id,
        receptionniste_id,
        date_heure_debut: formData.date_heure_debut,
        date_heure_fin: formData.date_heure_fin,
        motif: formData.motif,
        statut: formData.statut,
        ...(examenId && { examen_id: examenId }),
      };
      await appointmentService.createAppointment(rdvData);

      // 3. Create consentement if invasive
      if (isInvasive && examenId) {
        await consentementService.createConsentement({
          examen_id: examenId,
          patient_id: formData.patient_id,
          type_acte_invasif: typeActeInvasif,
          signature_requise: true,
        });
        toast.success(t('modal_consent_created'));
      }

      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success(t('modal_created'));
      onClose();
    } catch (err) {
      toast.error(err.message || t('error_generic'));
    }
  };

  const handleCreatePatient = async () => {
    try {
      const result = await patientService.createPatient(
        { adresse: newPatientForm.adresse, sexe: newPatientForm.sexe, date_naissance: newPatientForm.date_naissance },
        { nom: newPatientForm.nom, prenom: newPatientForm.prenom, email: newPatientForm.email, telephone: newPatientForm.telephone, role: 'patient' }
      );
      
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setFormData(prev => ({ ...prev, patient_id: result.patient.id }));
      setShowNewPatient(false);
      toast.success(t('patient_save_success'));
    } catch (err) {
      toast.error(err.message || t('error_generic'));
    }
  };

  if (!isOpen) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;
  const totalSteps = 4;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-full sm:max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{isEditing ? t('modal_edit_rdv') : t('modal_new_rdv')}</h2>
            {selectedPatient && (
              <p className="text-sm font-bold text-primary mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {selectedPatient.utilisateur?.prenom} {selectedPatient.utilisateur?.nom}
              </p>
            )}
            {isEditing && !selectedPatient && formData.motif && (
              <p className="text-sm font-bold text-amber-600 mt-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                {formData.motif.split('—')[1]?.replace('Patient:', '').trim() || 'Patient Externe (Guest)'}
              </p>
            )}
            {!isEditing && !selectedPatient && <p className="text-xs text-slate-500 font-semibold mt-0.5">{t('booking_step_progress').replace('{step}', step).replace('{total}', totalSteps)}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 group transition-colors">
            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b border-slate-50 flex-shrink-0">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", s <= step ? 'bg-primary' : 'bg-slate-100')} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Patient Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> {t('modal_select_patient')}
              </h3>

              {!showNewPatient ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t('modal_search_patient')}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-sm font-medium transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                    {filteredPatients.map(patient => (
                      <button
                        key={patient.id}
                        onClick={() => setFormData(prev => ({ ...prev, patient_id: patient.id }))}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group",
                          formData.patient_id === patient.id 
                            ? 'bg-primary/5 border border-primary/20 text-primary' 
                            : 'hover:bg-slate-50 border border-transparent'
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold">{patient.utilisateur?.prenom} {patient.utilisateur?.nom}</p>
                          <p className="text-xs text-slate-500 font-medium">{patient.utilisateur?.telephone}</p>
                        </div>
                        {formData.patient_id === patient.id && <Check className="h-5 w-5" />}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowNewPatient(true)}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:border-primary hover:text-primary transition-all"
                  >
                    + {t('modal_add_patient')}
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder={t('first_name')} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.prenom} onChange={e => setNewPatientForm(p => ({ ...p, prenom: e.target.value }))} />
                    <input placeholder={t('last_name')} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.nom} onChange={e => setNewPatientForm(p => ({ ...p, nom: e.target.value }))} />
                  </div>
                  <input placeholder={t('phone')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.telephone} onChange={e => setNewPatientForm(p => ({ ...p, telephone: e.target.value }))} />
                  <input placeholder={t('login_email_optional')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.email} onChange={e => setNewPatientForm(p => ({ ...p, email: e.target.value }))} />
                  <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.date_naissance} onChange={e => setNewPatientForm(p => ({ ...p, date_naissance: e.target.value }))} />
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.sexe} onChange={e => setNewPatientForm(p => ({ ...p, sexe: e.target.value }))}>
                    <option value="M">{t('gender_m')}</option>
                    <option value="F">{t('gender_f')}</option>
                  </select>
                  <div className="flex gap-3">
                    <button onClick={() => setShowNewPatient(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">{t('back')}</button>
                    <button onClick={handleCreatePatient} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">{t('save')}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Service */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> {t('modal_service_type')}
              </h3>
              <div className="space-y-2">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => setFormData(prev => ({ ...prev, service_id: service.id }))}
                    className={cn(
                      "w-full text-left p-4 rounded-xl transition-all flex items-center justify-between",
                      formData.service_id === service.id 
                        ? 'bg-primary/5 border-2 border-primary/30' 
                        : 'border-2 border-slate-100 hover:border-primary/20'
                    )}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{service.nom}</p>
                      {service.description && <p className="text-xs text-slate-500 mt-0.5 font-medium">{service.description}</p>}
                    </div>
                    {formData.service_id === service.id && (
                      <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> {t('modal_date_time')}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('modal_date_start')}</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                    value={formData.date_heure_debut ? format(new Date(formData.date_heure_debut), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => {
                      const start = new Date(e.target.value);
                      const end = new Date(start.getTime() + 30 * 60000);
                      setFormData(prev => ({ ...prev, date_heure_debut: start.toISOString(), date_heure_fin: end.toISOString() }));
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('modal_date_end')}</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                    value={formData.date_heure_fin ? format(new Date(formData.date_heure_fin), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_heure_fin: new Date(e.target.value).toISOString() }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (() => {
            const rawMotif = formData.motif || '';
            const hasDoc = rawMotif.includes('[DOC:');
            const docUrl = rawMotif.match(/\[DOC:(.*?)\]/)?.[1];
            const isGuestBooking = rawMotif.includes('— Patient:');
            
            const guestSpecialty = isGuestBooking ? rawMotif.match(/\[(.*?)\]/)?.[1] : '';
            const guestMessage = isGuestBooking 
              ? rawMotif.split('—')[0].replace(/\[(.*?)\]/, '').trim() 
              : rawMotif.replace(/\[DOC:.*?\]/g, '').trim();
            const guestPhone = isGuestBooking ? rawMotif.split('—')[2]?.replace('Tél:', '').trim() : '';
            const guestAge = rawMotif.match(/Âge:\s*(\d+)/)?.[1] || '';
            const guestNameMatch = rawMotif.match(/Patient:\s*([^\—\-]+)/);
            const guestName = guestNameMatch ? guestNameMatch[1].trim() : (isGuestBooking ? rawMotif.split('—')[1]?.replace('Patient:', '').trim() : 'Patient');

            return (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> {t('modal_details')}
                </h3>

                {isEditing && rawMotif && (guestMessage || hasDoc || isGuestBooking) && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">
                      {isGuestBooking ? "Informations de Réservation" : "Détails envoyés par le patient"}
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {isGuestBooking && (
                        <>
                          <div className="flex flex-col">
                            <span className="text-amber-600/70 text-xs font-semibold">Téléphone</span>
                            <span className="font-bold text-amber-900">{guestPhone || '-'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-amber-600/70 text-xs font-semibold">Âge</span>
                            <span className="font-bold text-amber-900">{guestAge || '-'}</span>
                          </div>
                          <div className="flex flex-col col-span-2 pt-2 border-t border-amber-200/50">
                            <span className="text-amber-600/70 text-xs font-semibold">Type d'examen / Spécialité</span>
                            <span className="font-black text-amber-900 text-base">{guestSpecialty || 'Non spécifiée'}</span>
                          </div>
                        </>
                      )}
                      
                      {guestMessage && guestMessage !== 'Demande en ligne' && (
                        <div className="flex flex-col col-span-2 pt-2 border-t border-amber-200/50">
                          <span className="text-amber-600/70 text-xs font-semibold">Message du patient</span>
                          <span className="font-medium text-amber-900 bg-white/50 p-2 rounded-lg text-sm italic mt-1 border border-amber-100">"{guestMessage}"</span>
                        </div>
                      )}
                    </div>
                    {hasDoc && (
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <a 
                          href={`${docUrl}?download=Ordonnance_${encodeURIComponent(guestName.replace(/\s+/g, '_'))}.${docUrl.split('.').pop()}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg"
                        >
                          <FileText className="h-3.5 w-3.5" /> Voir le document joint
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>{t('booking_motif_label')}</span>
                    {isEditing && isGuestBooking && <span className="text-[10px] text-amber-600">(Modifiable - contient les infos brutes)</span>}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={t('booking_motif_placeholder')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none"
                    value={formData.motif}
                    onChange={(e) => setFormData(prev => ({ ...prev, motif: e.target.value }))}
                  />
                </div>
              {isEditing && (
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('modal_status')}</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                    value={formData.statut}
                    onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                  >
                    <option value="planifie">{t('status_planifie')}</option>
                    <option value="confirme">{t('status_confirme')}</option>
                    <option value="termine">{t('status_termine')}</option>
                    <option value="annule">{t('status_annule')}</option>
                  </select>
                </div>
              )}

              {/* Consent Form Toggle */}
              {!isEditing && (
                <div className={cn('rounded-xl border-2 p-4 transition-all', isInvasive ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-slate-50/50')}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={cn('h-5 w-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0', isInvasive ? 'bg-amber-500 border-amber-500' : 'border-slate-300 bg-white')}
                      onClick={() => setIsInvasive(v => !v)}>
                      {isInvasive && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert className={cn('h-4 w-4', isInvasive ? 'text-amber-600' : 'text-slate-400')} />
                        <span className={cn('text-sm font-bold', isInvasive ? 'text-amber-800' : 'text-slate-600')}>{t('modal_invasive')}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{t('modal_invasive_hint')}</p>
                    </div>
                  </label>
                  {isInvasive && (
                    <div className="mt-4">
                      <label className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 block">{t('modal_invasive_type')} *</label>
                      <input
                        type="text"
                        placeholder={t('modal_invasive_placeholder')}
                        className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-amber-200 focus:border-amber-400"
                        value={typeActeInvasif}
                        onChange={(e) => setTypeActeInvasif(e.target.value)}
                      />
                      <p className="text-xs text-amber-600 font-medium mt-1.5">⚠️ {t('modal_invasive_warning')}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('booking_prescription')}</label>
                <FileUpload bucket="documents" folder="prescriptions" onUploadComplete={(_files) => {}} />
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('modal_summary')}</p>
                <p className="text-sm font-bold text-slate-800">{t('summary_patient')}: {selectedPatient?.utilisateur?.prenom} {selectedPatient?.utilisateur?.nom}</p>
                <p className="text-sm text-slate-600 font-medium">{t('summary_service')}: {selectedService?.nom}</p>
                <p className="text-sm text-slate-600 font-medium">{t('summary_date')}: {formData.date_heure_debut ? format(new Date(formData.date_heure_debut), 'PPP HH:mm', { locale: lang === 'ar' ? arDZ : fr }) : '-'}</p>
              </div>
            </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-white transition-colors">
                {t('back')}
              </button>
            )}
            {isEditing && (
              <button
                onClick={() => cancelMutation.mutate(appointment.id)}
                className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
              >
                {t('modal_cancel_rdv')}
              </button>
            )}
          </div>

          {step < totalSteps ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={(step === 1 && !formData.patient_id)}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100"
            >
              {t('next')} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isEditing ? t('modal_update_btn') : t('modal_create_btn')}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
