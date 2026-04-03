import { supabase } from '../lib/supabase';

export const examService = {
  async fetchExams(options = {}) {
    let query = supabase
      .from('examens')
      .select(`
        *,
        rendez_vous!examen_id(patient_id, patient:patient_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom))),
        radiologue:radiologue_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom)),
        service:service_id(*)
      `);

    if (options.statut) {
      query = query.eq('statut', options.statut);
    }

    if (options.patientId) {
      query = query.eq('rendez_vous.patient_id', options.patientId);
    }

    const { data, error } = await query.order('date_realisation', { ascending: false });
    if (error) throw error;

    // Flatten rendez_vous.patient up to the top level for components that expect .patient
    return data.map(exam => ({
      ...exam,
      patient: exam.rendez_vous?.[0]?.patient || null
    }));
  },

  async fetchExamById(id) {
    const { data, error } = await supabase
      .from('examens')
      .select(`
        *,
        rendez_vous!examen_id(patient_id, patient:patient_id(id, utilisateur_id, sexe, date_naissance, utilisateur:utilisateur_id(nom, prenom, telephone))),
        radiologue:radiologue_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom, specialite_principale)),
        service:service_id(*),
        images:images_radiologiques(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;

    // Flatten for convenience
    return {
      ...data,
      patient: data.rendez_vous?.[0]?.patient || null
    };
  },

  async updateExamStatus(id, statut) {
    const { data, error } = await supabase
      .from('examens')
      .update({ statut })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async fetchPendingExams() {
    return this.fetchExams({ statut: 'planifie' });
  }
};
