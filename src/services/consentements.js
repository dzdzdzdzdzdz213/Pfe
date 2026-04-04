import { supabase } from '../lib/supabase';

/**
 * @fileoverview Consent service — operations for the `consentements` table.
 *
 * Consent forms are created when a receptionniste marks an appointment as
 * involving an invasive procedure. The radiologue must call `markAsSigned`
 * before proceeding with the exam.
 *
 * Key table columns:
 *   - `examen_id` — links to `examens.id`
 *   - `patient_id` — links to `patients.id`
 *   - `type_acte_invasif` — text description of the invasive procedure
 *   - `signature_requise` — boolean, always `true` for invasive cases
 *   - `est_signe` — boolean, becomes `true` after radiologue confirmation
 *   - `date_signature` — ISO timestamp set when `est_signe` becomes `true`
 *   - `radiologue_confirmateur_id` — UUID of the confirming radiologue
 */

export const consentementService = {
  /**
   * Create a new consent form linked to an exam and patient.
   *
   * @param {{
   *   examen_id: string,
   *   patient_id: string,
   *   type_acte_invasif: string,
   *   signature_requise?: boolean
   * }} params
   *   - `signature_requise` defaults to `true`.
   * @returns {Promise<object>} The created consent record with `est_signe: false`.
   */
  async createConsentement({ examen_id, patient_id, type_acte_invasif, signature_requise = true }) {
    const { data, error } = await supabase
      .from('consentements')
      .insert({
        examen_id,
        patient_id,
        type_acte_invasif,
        signature_requise,
        est_signe: false,
        date_creation: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Fetch the consent record linked to a specific exam ID, or `null` if none exists.
   * Uses `maybeSingle()` so it doesn't throw on 0 rows.
   *
   * @param {string} examen_id - UUID of the linked `examens` row.
   * @returns {Promise<object|null>} Consent record, or `null` if not found.
   */
  async fetchConsentement(examen_id) {
    const { data, error } = await supabase
      .from('consentements')
      .select('*')
      .eq('examen_id', examen_id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Mark a consent form as signed by a radiologue.
   * Sets `est_signe = true`, records `date_signature`, and stores the confirming
   * radiologue's ID.
   *
   * @param {string} consentement_id - UUID of the `consentements` row.
   * @param {string} radiologue_id - UUID of the radiologue (from `radiologues.id`).
   * @returns {Promise<object>} Updated consent record with `est_signe: true`.
   */
  async markAsSigned(consentement_id, radiologue_id) {
    const { data, error } = await supabase
      .from('consentements')
      .update({
        est_signe: true,
        date_signature: new Date().toISOString(),
        radiologue_confirmateur_id: radiologue_id
      })
      .eq('id', consentement_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Fetch all unsigned, required consent forms.
   * Used by the radiologue dashboard to show pending action items.
   * Results are ordered oldest-first (FIFO).
   *
   * @returns {Promise<Array<object>>} Pending consents with nested exam and patient data.
   */
  async fetchPendingConsentements() {
    const { data, error } = await supabase
      .from('consentements')
      .select(`
        *,
        examens:examen_id(id, statut, date_realisation, services:service_id(nom)),
        patients:patient_id(id, utilisateur:utilisateur_id(prenom, nom))
      `)
      .eq('est_signe', false)
      .eq('signature_requise', true)
      .order('date_creation', { ascending: true });
    if (error) throw error;
    return data || [];
  },
};
