import { supabase } from '../lib/supabase';

/**
 * @fileoverview Exam service — CRUD operations for the `examens` table.
 *
 * Due to the indirect patient→exam link (via `rendez_vous`), all fetch
 * operations JOIN through `rendez_vous!examen_id` to surface `patient` data.
 */

export const examService = {
  /**
   * Fetch examens with optional filters.
   * Patient data is flattened from `rendez_vous[0].patient` to `exam.patient`
   * for component convenience.
   *
   * @param {{ statut?: string, patientId?: string }} [options={}]
   *   - `statut`: Filter by exam status (e.g. `'planifie'`, `'en_cours'`).
   *   - `patientId`: Filter to exams linked to this patient UUID (via rendez_vous).
   * @returns {Promise<Array<object>>} Exam list with `patient`, `radiologue`, `service` nested.
   */
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

  /**
   * Fetch a single exam by ID with full nested data:
   * patient demographics, radiologue profile, service, and linked images.
   *
   * @param {string} id - UUID of the `examens` row.
   * @returns {Promise<object>} Full exam object with `patient` flattened from rendez_vous.
   */
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

    return {
      ...data,
      patient: data.rendez_vous?.[0]?.patient || null
    };
  },

  /**
   * Update the status of an exam.
   *
   * @param {string} id - UUID of the exam.
   * @param {'planifie'|'en_cours'|'completed'|'annule'} statut - New status value.
   * @returns {Promise<object>} Updated exam row.
   */
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

  /**
   * Convenience method — fetch all exams with status `'planifie'`.
   *
   * @returns {Promise<Array<object>>} Array of pending exam objects.
   */
  async fetchPendingExams() {
    return this.fetchExams({ statut: 'planifie' });
  }
};
