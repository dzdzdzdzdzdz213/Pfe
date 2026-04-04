import { supabase } from '../lib/supabase';

/**
 * @fileoverview Appointment service — CRUD operations for the `rendez_vous` table.
 *
 * Supports both real Supabase queries and a local demo-mode fallback that
 * stores data in `localStorage` via the demo helper utilities.
 *
 * Schema columns used:
 *   - `date_heure_debut` / `date_heure_fin` — ISO timestamp range of the slot
 *   - `statut` — `'planifie' | 'confirme' | 'en_cours' | 'realise' | 'annule'`
 *   - `patient_id` → `patients.id`
 *   - `receptionniste_id` → `receptionnistes.id`
 *   - `examen_id` → `examens.id` (set after exam creation)
 */

export const appointmentService = {
  /**
   * Fetch appointments with optional date-range, patient, and status filters.
   * Results are ordered by `date_heure_debut` ascending.
   *
   * @param {{
   *   startDate?: string,
   *   endDate?: string,
   *   patientId?: string,
   *   statut?: string
   * }} [options={}]
   *   - `startDate` / `endDate`: ISO datetime strings for bounding the query.
   *   - `patientId`: Filter to a specific patient UUID.
   *   - `statut`: Filter by appointment status string.
   * @returns {Promise<Array<object>>} Appointments with nested patient, assistant, service.
   */
  async fetchAppointments(options = {}) {
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

  /**
   * Create a new appointment (rendez-vous) row.
   * In demo mode, the row is persisted to localStorage.
   *
   * @param {{
   *   patient_id: string,
   *   date_heure_debut: string,
   *   date_heure_fin: string,
   *   motif?: string,
   *   statut?: string,
   *   receptionniste_id?: string,
   *   examen_id?: string,
   *   service_id?: string
   * }} appointmentData - Columns to insert into `rendez_vous`.
   * @returns {Promise<object>} The created appointment row.
   */
  async createAppointment(appointmentData) {

    const { data, error } = await supabase
      .from('rendez_vous')
      .insert(appointmentData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Update any fields of an existing appointment by ID.
   *
   * @param {string} id - UUID of the `rendez_vous` row.
   * @param {Partial<{
   *   statut: string,
   *   motif: string,
   *   date_heure_debut: string,
   *   date_heure_fin: string,
   *   examen_id: string
   * }>} updates - Partial update payload.
   * @returns {Promise<object>} The updated appointment row.
   */
  async updateAppointment(id, updates) {

    const { data, error } = await supabase
      .from('rendez_vous')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Cancel an appointment by setting `statut = 'annule'` and updating `motif`.
   *
   * @param {string} id - UUID of the `rendez_vous` row.
   * @param {string} [reason='Annulé'] - Cancellation reason stored in `motif`.
   * @returns {Promise<object>} Updated appointment row.
   */
  async cancelAppointment(id, reason) {

    const { data, error } = await supabase
      .from('rendez_vous')
      .update({ statut: 'annule', motif: reason })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Check if a time slot is available (no conflicting non-cancelled appointments).
   * Uses a half-open interval overlap check: `start < endTime AND end > startTime`.
   *
   * @param {string} startTime - ISO datetime for the desired slot start.
   * @param {string} endTime - ISO datetime for the desired slot end.
   * @param {string|null} [excludeId=null] - Appointment UUID to exclude (for edits).
   * @returns {Promise<boolean>} `true` if the slot is free, `false` if conflicting.
   */
  async checkAvailability(startTime, endTime, excludeId = null) {

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
