import { supabase } from '../lib/supabase';
import { isDemoMode, getMockData, saveMockData } from '../lib/demo';

export const appointmentService = {
  async fetchAppointments(options = {}) {
    if (isDemoMode()) {
      let list = getMockData('appointments', []);
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
        assistant:receptionniste_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom)),
        service:service_id(*)
      `);

    if (options.startDate && options.endDate) {
      query = query.gte('date_heure_debut', options.startDate).lte('date_heure_fin', options.endDate);
    }

    if (options.patientId) {
      query = query.eq('patient_id', options.patientId);
    }

    const { data, error } = await query.order('date_heure_debut', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createAppointment(appointmentData) {
    if (isDemoMode()) {
      const list = getMockData('appointments', []);
      const newAppt = {
        ...appointmentData,
        id: 'appt-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      list.push(newAppt);
      saveMockData('appointments', list);
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
      const list = getMockData('appointments', []).map(a =>
        a.id === id ? { ...a, ...updates } : a
      );
      saveMockData('appointments', list);
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
      const list = getMockData('appointments', []).map(a =>
        a.id === id ? { ...a, statut: 'annule', motif: reason } : a
      );
      saveMockData('appointments', list);
      await new Promise(r => setTimeout(r, 400));
      return list.find(a => a.id === id);
    }

    const { data, error } = await supabase
      .from('rendez_vous')
      .update({ statut: 'annule', motif: reason })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async checkAvailability(startTime, endTime, excludeId = null) {
    if (isDemoMode()) return true;

    let query = supabase
      .from('rendez_vous')
      .select('id')
      .neq('statut', 'annule')
      .lt('date_heure_debut', endTime)
      .gt('date_heure_fin', startTime);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.length === 0;
  }
};
