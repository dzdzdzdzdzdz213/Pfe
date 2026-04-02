import { supabase } from '../lib/supabase';

export const reportService = {
  async fetchReports(options = {}) {
    let query = supabase
      .from('compte_rendu')
      .select(`
        *,
        radiologue:radiologue_id(id, utilisateur_id, utilisateur:utilisateur_id(nom, prenom)),
        document:document_medical_id(*)
      `);

    if (options.radiologueId) {
      query = query.eq('radiologue_id', options.radiologueId);
    }

    if (typeof options.estValide === 'boolean') {
      query = query.eq('est_valide', options.estValide);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createReport(reportData) {
    const { data, error } = await supabase
      .from('compte_rendu')
      .insert(reportData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateReport(id, updates) {
    const { data, error } = await supabase
      .from('compte_rendu')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async validateReport(id) {
    return this.updateReport(id, { est_valide: true });
  },

  async fetchReportById(id) {
    const { data, error } = await supabase
      .from('compte_rendu')
      .select(`
        *,
        radiologue:radiologue_id(id, utilisateur_id, utilisateur:utilisateur_id(*)),
        document:document_medical_id(*, examen:examen_id(*, patient:patient_id(*, utilisateur:utilisateur_id(*))))
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }
};
