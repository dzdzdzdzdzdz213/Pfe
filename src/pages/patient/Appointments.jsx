import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { appointmentService } from '@/services/appointments';
import { toast } from 'sonner';
import { formatDate, formatTime, cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Calendar, Clock, Check, ChevronRight, ChevronLeft, Loader2, FileText, X, Upload } from 'lucide-react';
import { FileUpload } from '@/components/common/FileUpload';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

const TIME_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

export const PatientAppointments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [motif, setMotif] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const { data: patientRecord } = useQuery({
    queryKey: ['patient-record', user?.id],
    queryFn: async () => {
      if (localStorage.getItem('demo_mock_session')) {
        // Return a fake patient record for demo mode
        return { id: 'demo-patient-record', utilisateur_id: user?.id };
      }
      const { data } = await supabase.from('patient').select('*').eq('utilisateur_id', user?.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', patientRecord?.id],
    queryFn: () => appointmentService.fetchAppointments({ patientId: patientRecord?.id }),
    enabled: !!patientRecord?.id,
  });

  const MOCK_SERVICES = [
    { id: '1', nom: 'Scanner (Tomodensitométrie)', description: 'Imagerie en coupes fines des organes internes' },
    { id: '2', nom: 'Radiographie', description: 'Visualisation des os et organes par rayons X' },
    { id: '3', nom: 'Échographie', description: 'Exploration par ultrasons en temps réel' },
    { id: '4', nom: 'Doppler', description: 'Étude de la circulation sanguine' },
    { id: '5', nom: 'Mammographie', description: 'Exploration radiologique du sein' },
    { id: '6', nom: 'Microbiopsie', description: 'Prélèvement tissulaire guidé' },
    { id: '7', nom: 'Cytoponction', description: 'Prélèvement cellulaire par fine aiguille' },
    { id: '8', nom: 'DMO - Densitométrie Osseuse', description: 'Mesure de la densité minérale des os' },
  ];

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      if (localStorage.getItem('demo_mock_session')) return MOCK_SERVICES;
      const { data } = await supabase.from('service').select('*');
      return data?.length ? data : MOCK_SERVICES;
    },
  });

  const upcomingAppts = appointments.filter(a => new Date(a.dateHeureDebut) > new Date() && a.statut !== 'cancelled');
  const pastAppts = appointments.filter(a => new Date(a.dateHeureDebut) <= new Date());

  const createMutation = useMutation({
    mutationFn: async () => {
      const [hours, minutes] = selectedTime.split(':');
      const start = new Date(selectedDate);
      start.setHours(parseInt(hours), parseInt(minutes), 0);
      const end = new Date(start.getTime() + 30 * 60000);

      return appointmentService.createAppointment({
        patient_id: patientRecord?.id,
        service_id: selectedService?.id,
        dateHeureDebut: start.toISOString(),
        dateHeureFin: end.toISOString(),
        motif,
        statut: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      toast.success('Rendez-vous réservé avec succès !');
      setBookingStep(5);
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => appointmentService.cancelAppointment(id, 'Annulé par le patient'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      toast.success('Rendez-vous annulé');
    },
  });

  const resetBooking = () => {
    setBookingStep(0);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setMotif('');
  };

  const monthDays = eachDayOfInterval({ start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth) });
  const today = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mes Rendez-vous</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Gérez vos rendez-vous et réservez en ligne</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-0">
        {[{ id: 'upcoming', label: 'À venir' }, { id: 'past', label: 'Passés' }, { id: 'book', label: '+ Réserver' }].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'book') resetBooking(); }}
            className={cn('px-5 py-3 text-sm font-bold rounded-t-xl transition-all border-b-2 -mb-px', activeTab === tab.id ? (tab.id === 'book' ? 'text-emerald-600 border-emerald-500 bg-emerald-50/50' : 'text-primary border-primary bg-white') : 'text-slate-500 border-transparent hover:text-slate-700')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {activeTab === 'upcoming' && (
        <div className="space-y-3">
          {upcomingAppts.length > 0 ? upcomingAppts.map(appt => (
            <div key={appt.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 flex-wrap">
              <div className="text-center bg-primary/5 rounded-xl px-4 py-3 border border-primary/10">
                <p className="text-lg font-extrabold text-primary">{formatTime(appt.dateHeureDebut)}</p>
                <p className="text-xs text-slate-500 font-bold">{formatDate(appt.dateHeureDebut)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{appt.motif || 'Consultation'}</p>
                <span className={cn('inline-block px-3 py-1 rounded-full text-[11px] font-bold border mt-1', getStatusColor(appt.statut))}>{getStatusLabel(appt.statut)}</span>
              </div>
              <button onClick={() => cancelMutation.mutate(appt.id)} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">Annuler</button>
            </div>
          )) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">Aucun rendez-vous à venir</p>
              <button onClick={() => { setActiveTab('book'); resetBooking(); }} className="text-xs font-bold text-primary hover:underline mt-2">Réserver maintenant →</button>
            </div>
          )}
        </div>
      )}

      {/* Past */}
      {activeTab === 'past' && (
        <div className="space-y-3">
          {pastAppts.length > 0 ? pastAppts.map(appt => (
            <div key={appt.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 opacity-80">
              <div className="text-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <p className="text-lg font-extrabold text-slate-600">{formatTime(appt.dateHeureDebut)}</p>
                <p className="text-xs text-slate-400 font-bold">{formatDate(appt.dateHeureDebut)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700">{appt.motif || 'Consultation'}</p>
                <span className={cn('inline-block px-3 py-1 rounded-full text-[11px] font-bold border mt-1', getStatusColor(appt.statut))}>{getStatusLabel(appt.statut)}</span>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">Aucun rendez-vous passé</p>
            </div>
          )}
        </div>
      )}

      {/* Booking Wizard */}
      {activeTab === 'book' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {['Service', 'Date', 'Heure', 'Détails', 'Confirmer'].map((s, i) => (
              <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= bookingStep ? 'bg-primary' : 'bg-slate-100')} />
            ))}
          </div>

          {/* Step 1: Service */}
          {bookingStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800">Choisissez un service</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(service => (
                  <button key={service.id} onClick={() => { setSelectedService(service); setBookingStep(1); }}
                    className="text-left p-5 rounded-xl border-2 border-slate-100 hover:border-primary/30 transition-all group">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-primary">{service.nom}</p>
                    {service.description && <p className="text-xs text-slate-500 mt-1 font-medium">{service.description}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date */}
          {bookingStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800">Choisissez une date</h3>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCalendarMonth(d => addDays(startOfMonth(d), -1))} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"><ChevronLeft className="h-5 w-5" /></button>
                <span className="text-sm font-bold text-slate-800 capitalize">{format(calendarMonth, 'MMMM yyyy', { locale: fr })}</span>
                <button onClick={() => setCalendarMonth(d => addDays(endOfMonth(d), 1))} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"><ChevronRight className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                  <span key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">{d}</span>
                ))}
                {monthDays.map(day => {
                  const isPast = isBefore(day, today) && !isSameDay(day, today);
                  const isSunday = day.getDay() === 0;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  return (
                    <button key={day.toISOString()} disabled={isPast || isSunday}
                      onClick={() => { setSelectedDate(day); setBookingStep(2); }}
                      className={cn('h-10 rounded-xl text-sm font-bold transition-all',
                        isSelected ? 'bg-primary text-white shadow-lg shadow-blue-200' :
                        isPast || isSunday ? 'text-slate-300 cursor-not-allowed' :
                        isSameDay(day, today) ? 'bg-primary/10 text-primary border border-primary/20' :
                        'text-slate-700 hover:bg-slate-50')}>
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Time */}
          {bookingStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800">Choisissez une heure</h3>
              <p className="text-xs text-slate-500 font-medium">{selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TIME_SLOTS.map(time => (
                  <button key={time} onClick={() => { setSelectedTime(time); setBookingStep(3); }}
                    className={cn('py-3 rounded-xl text-sm font-bold transition-all border',
                      selectedTime === time ? 'bg-primary text-white border-primary shadow-lg shadow-blue-200' : 'bg-white border-slate-200 text-slate-700 hover:border-primary/30')}>
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {bookingStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800">Détails supplémentaires</h3>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Motif de la visite</label>
                <textarea rows={3} placeholder="Décrivez brièvement le motif..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none" value={motif} onChange={e => setMotif(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Ordonnance (optionnel)</label>
                <FileUpload bucket="documents" folder="prescriptions" />
              </div>
              <button onClick={() => setBookingStep(4)} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                Continuer <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 5: Confirm */}
          {bookingStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800">Confirmation</h3>
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Service</span><span className="font-bold text-slate-800">{selectedService?.nom}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Date</span><span className="font-bold text-slate-800">{selectedDate && format(selectedDate, 'dd/MM/yyyy')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Heure</span><span className="font-bold text-slate-800">{selectedTime}</span></div>
                {motif && <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Motif</span><span className="font-bold text-slate-800">{motif}</span></div>}
              </div>
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                Confirmer la Réservation
              </button>
            </div>
          )}

          {/* Step 6: Success */}
          {bookingStep === 5 && (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Rendez-vous Confirmé !</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">Votre rendez-vous a été enregistré avec succès. Vous recevrez une notification de confirmation.</p>
              <button onClick={() => { setActiveTab('upcoming'); resetBooking(); }} className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
                Voir mes Rendez-vous
              </button>
            </div>
          )}

          {/* Back Button */}
          {bookingStep > 0 && bookingStep < 5 && (
            <button onClick={() => setBookingStep(s => s - 1)} className="mt-4 text-sm font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> Retour
            </button>
          )}
        </div>
      )}
    </div>
  );
};
