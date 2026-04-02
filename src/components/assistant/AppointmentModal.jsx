import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointments';
import { patientService } from '@/services/patients';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { X, Search, UserPlus, Clock, Calendar, FileText, Loader2, ChevronRight, Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { FileUpload } from '@/components/common/FileUpload';

export const AppointmentModal = ({ isOpen, onClose, appointment = null, selectedSlot = null }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!appointment;
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    patient_id: appointment?.patient_id || '',
    service_id: appointment?.service_id || '',
    dateHeureDebut: appointment?.dateHeureDebut || (selectedSlot ? selectedSlot.start.toISOString() : ''),
    dateHeureFin: appointment?.dateHeureFin || (selectedSlot ? selectedSlot.end.toISOString() : ''),
    motif: appointment?.motif || '',
    statut: appointment?.statut || 'pending',
  });

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
      const { data, error } = await supabase.from('service').select('*');
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
      toast.success('Rendez-vous créé avec succès !');
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Erreur lors de la création'),
  });

  // Update appointment mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentService.updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Rendez-vous mis à jour !');
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Erreur lors de la mise à jour'),
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id) => appointmentService.cancelAppointment(id, 'Annulé par l\'assistant'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Rendez-vous annulé');
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!formData.patient_id || !formData.dateHeureDebut) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (isEditing) {
      updateMutation.mutate({ id: appointment.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, assistant_id: user?.id });
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
      toast.success('Patient enregistré !');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
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
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {isEditing ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Étape {step} sur {totalSteps}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="h-5 w-5" /></button>
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
                <UserPlus className="h-4 w-4 text-primary" /> Sélectionner un Patient
              </h3>

              {!showNewPatient ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Chercher par nom ou téléphone..."
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
                    + Ajouter un nouveau patient
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Prénom" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.prenom} onChange={e => setNewPatientForm(p => ({ ...p, prenom: e.target.value }))} />
                    <input placeholder="Nom" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.nom} onChange={e => setNewPatientForm(p => ({ ...p, nom: e.target.value }))} />
                  </div>
                  <input placeholder="Téléphone" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.telephone} onChange={e => setNewPatientForm(p => ({ ...p, telephone: e.target.value }))} />
                  <input placeholder="Email (optionnel)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.email} onChange={e => setNewPatientForm(p => ({ ...p, email: e.target.value }))} />
                  <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.date_naissance} onChange={e => setNewPatientForm(p => ({ ...p, date_naissance: e.target.value }))} />
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={newPatientForm.sexe} onChange={e => setNewPatientForm(p => ({ ...p, sexe: e.target.value }))}>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                  <div className="flex gap-3">
                    <button onClick={() => setShowNewPatient(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Retour</button>
                    <button onClick={handleCreatePatient} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">Enregistrer</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Service */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Type de Service
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
                <Calendar className="h-4 w-4 text-primary" /> Date et Heure
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Date et heure de début</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                    value={formData.dateHeureDebut ? format(new Date(formData.dateHeureDebut), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => {
                      const start = new Date(e.target.value);
                      const end = new Date(start.getTime() + 30 * 60000);
                      setFormData(prev => ({ ...prev, dateHeureDebut: start.toISOString(), dateHeureFin: end.toISOString() }));
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Date et heure de fin</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                    value={formData.dateHeureFin ? format(new Date(formData.dateHeureFin), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateHeureFin: new Date(e.target.value).toISOString() }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Détails
              </h3>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Motif de la visite</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez brièvement le motif..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none"
                  value={formData.motif}
                  onChange={(e) => setFormData(prev => ({ ...prev, motif: e.target.value }))}
                />
              </div>
              {isEditing && (
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Statut</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                    value={formData.statut}
                    onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Ordonnance (optionnel)</label>
                <FileUpload bucket="documents" folder="prescriptions" onUploadComplete={(files) => console.log('Uploaded:', files)} />
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Récapitulatif</p>
                <p className="text-sm font-bold text-slate-800">Patient: {selectedPatient?.utilisateur?.prenom} {selectedPatient?.utilisateur?.nom}</p>
                <p className="text-sm text-slate-600 font-medium">Service: {selectedService?.nom}</p>
                <p className="text-sm text-slate-600 font-medium">Date: {formData.dateHeureDebut ? format(new Date(formData.dateHeureDebut), 'PPP HH:mm', { locale: fr }) : '-'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-white transition-colors">
                Précédent
              </button>
            )}
            {isEditing && (
              <button
                onClick={() => cancelMutation.mutate(appointment.id)}
                className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
              >
                Annuler RDV
              </button>
            )}
          </div>

          {step < totalSteps ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={(step === 1 && !formData.patient_id)}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100"
            >
              Suivant <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isEditing ? 'Mettre à jour' : 'Créer le RDV'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
