import { supabase } from '../lib/supabase';

export const examService = {
  async fetchExams(options = {}) {
    let query = supabase
      .from('examen')
      .select(`
        *,
        patient:patient_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom)),
        radiologue:radiologue_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom)),
        service:service_id(*)
      `);

    if (options.statut) {
      query = query.eq('statut', options.statut);
    }

    if (options.patientId) {
      query = query.eq('patient_id', options.patientId);
    }

    const { data, error } = await query.order('dateRealisation', { ascending: false });
    if (error) throw error;
    return data;
  },

  async fetchExamById(id) {
    const { data, error } = await supabase
      .from('examen')
      .select(`
        *,
        patient:patient_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom, telephone, sexe, date_naissance)),
        radiologue:radiologue_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom, specialite_principale)),
        service:service_id(*),
        images:image_radiologique(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateExamStatus(id, statut) {
    const { data, error } = await supabase
      .from('examen')
      .update({ statut })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async fetchPendingExams() {
    return this.fetchExams({ statut: 'pending' });
  }
};
