import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { appointmentService } from '@/services/appointments';
import { toast } from 'sonner';
import { formatDate, formatTime, cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Calendar, Clock, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { FileUpload } from '@/components/common/FileUpload';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore } from 'date-fns';
import { fr, arSA } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

const TIME_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

export const PatientAppointments = () => {
  const { user, utilisateur } = useAuth();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [motif, setMotif] = useState('');
  const [uploadedDocUrl, setUploadedDocUrl] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const dateLocale = lang === 'ar' ? arSA : fr;

  const { data: patientRecord } = useQuery({
    queryKey: ['patient-record', utilisateur?.id],
    queryFn: async () => {
      if (!utilisateur?.id) return null;
      // Ensure we find the patient record using the utilisateur's database ID
      const { data } = await supabase
        .from('patients')
        .select('*, utilisateur:utilisateur_id(*)')
        .eq('utilisateur_id', utilisateur.id)
        .maybeSingle();
      return data;
    },
    enabled: !!utilisateur?.id,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', patientRecord?.id],
    queryFn: () => appointmentService.fetchAppointments({ patientId: patientRecord?.id }),
    enabled: !!patientRecord?.id,
  });


  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await supabase.from('services').select('*');
      return data || [];
    },
  });

  const upcomingAppts = appointments.filter(a => new Date(a.date_heure_debut) > new Date() && a.statut !== 'annule');
  const pastAppts = appointments.filter(a => new Date(a.date_heure_debut) <= new Date());

  const createMutation = useMutation({
    mutationFn: async () => {
      const [hours, minutes] = selectedTime.split(':');
      const start = new Date(selectedDate);
      start.setHours(parseInt(hours), parseInt(minutes), 0);
      const end = new Date(start.getTime() + 30 * 60000);

      // 1. Create the exam first to hold the service_id
      const { data: exam, error: examError } = await supabase
        .from('examens')
        .insert({
          service_id: selectedService?.id,
          statut: 'planifie',
          date_realisation: start.toISOString(),
        })
        .select()
        .single();

      if (examError) throw examError;

      const finalMotif = uploadedDocUrl ? `${motif} [DOC:${uploadedDocUrl}]` : motif;

      // 2. Create the appointment linked to the exam
      return appointmentService.createAppointment({
        patient_id: patientRecord?.id,
        examen_id: exam.id,
        date_heure_debut: start.toISOString(),
        date_heure_fin: end.toISOString(),
        motif: finalMotif,
        statut: 'planifie',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      toast.success(t('appointments_confirm_success'));
      setBookingStep(5);
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => appointmentService.cancelAppointment(id, t('status_annule')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      toast.success(t('appointments_cancel_success'));
    },
  });

  const resetBooking = () => {
    setBookingStep(0);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setMotif('');
    setUploadedDocUrl('');
    setCalendarMonth(new Date());
  };

  const monthDays = eachDayOfInterval({ start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth) });
  const today = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('appointments_title')}</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{t('appointments_subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-0">
        {[
          { id: 'upcoming', label: t('appointments_upcoming') }, 
          { id: 'past', label: t('appointments_past') }, 
          { id: 'book', label: t('appointments_book') }
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'book') resetBooking(); }}
            className={cn('px-5 py-3 text-sm font-bold rounded-t-xl transition-all border-b-2 -mb-px', activeTab === tab.id ? (tab.id === 'book' ? 'text-emerald-600 border-emerald-500 bg-emerald-50/50' : 'text-primary border-primary bg-white') : 'text-slate-500 border-transparent hover:text-slate-700')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {activeTab === 'upcoming' && (
        <div className="space-y-3">
          {upcomingAppts.length > 0 ? upcomingAppts.map(appt => {
            const status = appt.statut || 'planifie';
            // Stepper: planifie → confirme → realise
            const steps = [
              { key: 'planifie', label: t('status_planifie') },
              { key: 'confirme', label: t('status_confirme') },
              { key: 'termine', label: t('status_termine') },
            ];
            const stepIdx = steps.findIndex(s => s.key === status);
            const activeStep = stepIdx >= 0 ? stepIdx : 0;

            return (
              <div key={appt.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="p-5 flex items-center gap-4 flex-wrap">
                  <div className="text-center bg-primary/5 rounded-xl px-4 py-3 border border-primary/10 flex-shrink-0">
                    <p className="text-lg font-extrabold text-primary">{formatTime(appt.date_heure_debut)}</p>
                    <p className="text-xs text-slate-500 font-bold">{formatDate(appt.date_heure_debut)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{appt.motif || t('consultation')}</p>
                    {appt.examen?.service?.nom && <p className="text-xs text-slate-500 font-medium mt-0.5">{appt.examen.service.nom}</p>}
                  </div>
                  <button
                    onClick={() => cancelMutation.mutate(appt.id)}
                    disabled={cancelMutation.isPending}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex-shrink-0"
                  >
                    {t('cancel')}
                  </button>
                </div>

                {/* Status Stepper */}
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-0">
                    {steps.map((step, i) => {
                      const isDone = i < activeStep;
                      const isCurrent = i === activeStep;
                      const isLast = i === steps.length - 1;
                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className={cn(
                              'h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all text-xs font-black',
                              isDone ? 'border-emerald-500 bg-emerald-500 text-white' :
                              isCurrent ? 'border-primary bg-primary text-white shadow-md shadow-blue-200' :
                              'border-slate-200 bg-white text-slate-400'
                            )}>
                              {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                            </div>
                            <p className={cn(
                              'text-[10px] font-bold mt-1.5 whitespace-nowrap',
                              isDone ? 'text-emerald-600' :
                              isCurrent ? 'text-primary' :
                              'text-slate-400'
                            )}>
                              {step.label}
                            </p>
                          </div>
                          {!isLast && (
                            <div className={cn(
                              'h-0.5 flex-1 mx-1.5 rounded-full transition-all mb-3.5',
                              i < activeStep ? 'bg-emerald-400' : 'bg-slate-200'
                            )} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">{t('appointments_empty')}</p>
              <button onClick={() => { setActiveTab('book'); resetBooking(); }} className="text-xs font-bold text-primary hover:underline mt-2">{t('appointments_book_now')} →</button>
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
                <p className="text-lg font-extrabold text-slate-600">{formatTime(appt.date_heure_debut)}</p>
                <p className="text-xs text-slate-400 font-bold">{formatDate(appt.date_heure_debut)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700">{appt.motif || 'Consultation'}</p>
                <span className={cn('inline-block px-3 py-1 rounded-full text-[11px] font-bold border mt-1', getStatusColor(appt.statut))}>{getStatusLabel(appt.statut)}</span>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">{t('no_past_appointments')}</p>
            </div>
          )}
        </div>
      )}

      {/* Booking Wizard */}
      {activeTab === 'book' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[t('booking_service'), t('booking_date'), t('booking_time'), t('booking_details'), t('booking_confirmation')].map((s, i) => (
              <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= bookingStep ? 'bg-primary' : 'bg-slate-100')} />
            ))}
          </div>

          {/* Step 1: Service */}
          {bookingStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800">{t('booking_choose_service')}</h3>
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
              <h3 className="text-base font-extrabold text-slate-800">{t('booking_choose_date')}</h3>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCalendarMonth(d => addDays(startOfMonth(d), -1))} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"><ChevronLeft className="h-5 w-5" /></button>
                <span className="text-sm font-bold text-slate-800 capitalize">{format(calendarMonth, 'MMMM yyyy', { locale: dateLocale })}</span>
                <button onClick={() => setCalendarMonth(d => addDays(endOfMonth(d), 1))} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"><ChevronRight className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')].map(d => (
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
              <h3 className="text-base font-extrabold text-slate-800">{t('booking_choose_time')}</h3>
              <p className="text-xs text-slate-500 font-medium">{selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: dateLocale })}</p>
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
              <h3 className="text-base font-extrabold text-slate-800">{t('booking_details')}</h3>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('booking_motif')}</label>
                <textarea rows={3} placeholder={t('booking_motif_placeholder')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none" value={motif} onChange={e => setMotif(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">{t('booking_prescription')}</label>
                <FileUpload 
                  bucket="documents" 
                  folder="prescriptions" 
                  onUploadComplete={(files) => {
                    if (files.length > 0) {
                      setUploadedDocUrl(files[0].url);
                    }
                  }}
                />
              </div>
              <button onClick={() => setBookingStep(4)} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                {t('next')} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 5: Confirm */}
          {bookingStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800">{t('booking_confirmation')}</h3>
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">{t('booking_service')}</span><span className="font-bold text-slate-800">{selectedService?.nom}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">{t('booking_date')}</span><span className="font-bold text-slate-800">{selectedDate && format(selectedDate, 'dd/MM/yyyy')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">{t('booking_time')}</span><span className="font-bold text-slate-800">{selectedTime}</span></div>
                {motif && <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">{t('booking_motif')}</span><span className="font-bold text-slate-800">{motif}</span></div>}
              </div>
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                {t('booking_confirm_btn')}
              </button>
            </div>
          )}

          {/* Step 6: Success */}
          {bookingStep === 5 && (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t('appointments_confirm_success')}</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">{t('appointments_confirm_message')}</p>
              <button onClick={() => { setActiveTab('upcoming'); resetBooking(); }} className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
                {t('appointments_view')}
              </button>
            </div>
          )}

          {/* Back Button */}
          {bookingStep > 0 && bookingStep < 5 && (
            <button onClick={() => setBookingStep(s => s - 1)} className="mt-4 text-sm font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> {t('back')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
