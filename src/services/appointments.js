import { supabase } from '../lib/supabase';

const isDemoMode = () => !!localStorage.getItem('demo_mock_session');

const getMockAppointments = () =>
  JSON.parse(localStorage.getItem('demo_mock_appointments') || '[]');

const saveMockAppointments = (list) =>
  localStorage.setItem('demo_mock_appointments', JSON.stringify(list));

export const appointmentService = {
  async fetchAppointments(options = {}) {
    if (isDemoMode()) {
      let list = getMockAppointments();
      if (options.patientId) {
        list = list.filter(a => a.patient_id === options.patientId);
      }
      return list;
    }

    let query = supabase
      .from('rendez_vous')
      .select(`
        *,
        patient:patient_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom, telephone)),
        assistant:assistant_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom)),
        service:service_id(*)
      `);

    if (options.startDate && options.endDate) {
      query = query.gte('dateHeureDebut', options.startDate).lte('dateHeureFin', options.endDate);
    }

    if (options.patientId) {
      query = query.eq('patient_id', options.patientId);
    }

    const { data, error } = await query.order('dateHeureDebut', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createAppointment(appointmentData) {
    if (isDemoMode()) {
      const list = getMockAppointments();
      const newAppt = {
        ...appointmentData,
        id: 'appt-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      list.push(newAppt);
      saveMockAppointments(list);
      await new Promise(r => setTimeout(r, 600));
      return newAppt;
    }

    const { data, error } = await supabase
      .from('rendez_vous')
      .insert(appointmentData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateAppointment(id, updates) {
    if (isDemoMode()) {
      const list = getMockAppointments().map(a =>
        a.id === id ? { ...a, ...updates } : a
      );
      saveMockAppointments(list);
      await new Promise(r => setTimeout(r, 400));
      return list.find(a => a.id === id);
    }

    const { data, error } = await supabase
      .from('rendez_vous')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async cancelAppointment(id, reason) {
    if (isDemoMode()) {
      const list = getMockAppointments().map(a =>
        a.id === id ? { ...a, statut: 'cancelled', motif: reason } : a
      );
      saveMockAppointments(list);
      await new Promise(r => setTimeout(r, 400));
      return list.find(a => a.id === id);
    }

    const { data, error } = await supabase
      .from('rendez_vous')
      .update({ statut: 'cancelled', motif: reason })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async checkAvailability(startTime, endTime, excludeId = null) {
    if (isDemoMode()) return true; // always available in demo

    let query = supabase
      .from('rendez_vous')
      .select('id')
      .neq('statut', 'cancelled')
      .or(`dateHeureDebut.lt.${endTime},dateHeureFin.gt.${startTime}`);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.length === 0;
  }
};
