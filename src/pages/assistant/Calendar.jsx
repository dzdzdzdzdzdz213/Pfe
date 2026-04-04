import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { fr, arDZ } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointments';
import { supabase } from '@/lib/supabase';
import { getStatusColor, getStatusLabel, getServiceColor } from '@/lib/utils';
import { AppointmentModal } from '@/components/assistant/AppointmentModal';
import { toast } from 'sonner';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useLanguage } from '@/contexts/LanguageContext';


const locales = { 'fr': fr, 'ar': arDZ };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const getMessages = (t) => ({
  today: t('today'),
  previous: t('previous'),
  next: t('next'),
  month: t('month'),
  week: t('week'),
  day: t('day'),
  agenda: t('agenda'),
  date: t('date'),
  time: t('time'),
  event: t('event'),
  noEventsInRange: t('no_events_in_range'),
});

const CustomToolbar = ({ label, onNavigate, onView, view, t }) => {
  const labelMonth = t('month');
  const labelWeek = t('week');
  const labelDay = t('day');
  const labelToday = t('today');

  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate('PREV')} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <button onClick={() => onNavigate('TODAY')} className="px-4 py-2.5 text-sm font-bold text-primary bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors">
          {labelToday}
        </button>
        <button onClick={() => onNavigate('NEXT')} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
          <ChevronRight className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-extrabold text-slate-900 ml-2 capitalize tracking-tight">{label}</h2>
      </div>
      <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
        {['month', 'week', 'day'].map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-4 py-2.5 text-sm font-bold transition-colors ${
              view === v ? 'bg-primary text-white shadow-inner' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {v === 'month' ? labelMonth : v === 'week' ? labelWeek : labelDay}
          </button>
        ))}
      </div>
    </div>
  );
};

const EventComponent = ({ event }) => (
  <div className="px-1.5 py-0.5 text-[11px] font-bold leading-tight truncate" title={event.title}>
    <span>{event.title}</span>
  </div>
);

export const AssistantCalendar = () => {
  const { t, lang } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const queryClient = useQueryClient();

  const start = startOfMonth(subMonths(currentDate, 1)).toISOString();
  const end = endOfMonth(addMonths(currentDate, 1)).toISOString();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', 'calendar', start, end],
    queryFn: () => appointmentService.fetchAppointments({ startDate: start, endDate: end }),
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('calendar-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rendez_vous' }, () => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  const events = useMemo(() => {
    return appointments.map((appt, i) => ({
      id: appt.id,
      title: `${appt.patient?.utilisateur?.prenom || ''} ${appt.patient?.utilisateur?.nom || 'Patient'}`,
      start: new Date(appt.dateHeureDebut),
      end: new Date(appt.dateHeureFin),
      resource: appt,
    }));
  }, [appointments]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource);
    setSelectedSlot(null);
    setModalOpen(true);
  };

  const handleSelectSlot = (slotInfo) => {
    setSelectedEvent(null);
    setSelectedSlot(slotInfo);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    setSelectedSlot(null);
  };

  const eventStyleGetter = (event) => {
    const status = event.resource?.statut || 'pending';
    const bg = status === 'confirmed' ? '#10b981' : status === 'pending' ? '#f59e0b' : status === 'cancelled' ? '#ef4444' : '#2563eb';
    return {
      style: {
        backgroundColor: bg,
        borderRadius: '8px',
        opacity: status === 'cancelled' ? 0.5 : 1,
        color: 'white',
        border: 'none',
        fontSize: '12px',
        fontWeight: 700,
        padding: '2px 6px',
      },
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('assistant_calendar_title')}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{t('assistant_calendar_subtitle')}</p>
        </div>
        <button
          onClick={() => { setSelectedEvent(null); setSelectedSlot(null); setModalOpen(true); }}
          className="px-5 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
          {t('assistant_new_rdv')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 min-h-[650px]">
        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="h-10 w-10 border-b-2 border-primary rounded-full animate-spin" />
          </div>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 650 }}
            selectable
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: (props) => <CustomToolbar {...props} t={t} />,
              event: EventComponent,
            }}
            messages={getMessages(t)}
            culture={lang}
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date)}
            views={['month', 'week', 'day']}
            defaultView="week"
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 19, 0, 0)}
          />
        )}
      </div>

      {modalOpen && (
        <AppointmentModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          appointment={selectedEvent}
          selectedSlot={selectedSlot}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .rbc-header { font-weight: 800 !important; font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; padding: 12px 8px !important; color: #64748b !important; border-color: #f1f5f9 !important; }
        .rbc-month-view, .rbc-time-view { border-radius: 12px !important; border-color: #f1f5f9 !important; overflow: hidden; }
        .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row { border-color: #f1f5f9 !important; }
        .rbc-off-range-bg { background: #fafbfc !important; }
        .rbc-today { background-color: #eff6ff !important; }
        .rbc-time-slot { border-color: #f8fafc !important; }
        .rbc-timeslot-group { border-color: #f1f5f9 !important; }
        .rbc-time-content { border-color: #f1f5f9 !important; }
        .rbc-time-header-content { border-color: #f1f5f9 !important; }
        .rbc-time-header { border-bottom: 2px solid #f1f5f9 !important; }
        .rbc-allday-cell { display: none !important; }
        .rbc-current-time-indicator { background-color: #2563eb !important; height: 2px !important; }
        .rbc-event { box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important; }
        .rbc-event:focus { outline: 2px solid #2563eb !important; outline-offset: 2px !important; }
        .rbc-label { font-size: 11px !important; font-weight: 600 !important; color: #94a3b8 !important; }
        .rbc-date-cell { font-weight: 700 !important; color: #475569 !important; padding: 6px 10px !important; }
      `}} />
    </div>
  );
};
