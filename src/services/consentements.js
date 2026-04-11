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
   * Create a new consent form linked to an exam.
   *
   * @param {{
   *   examen_id: string,
   *   type_acte_invasif: string,
   *   signature_requise?: boolean,
   *   document_medical_id?: string
   * }} params
   * @returns {Promise<object>} The created consent record.
   */
  async createConsentement({ examen_id, type_acte_invasif, signature_requise = true, document_medical_id = null }) {
    const { data, error } = await supabase
      .from('consentements')
      .insert({
        examen_id,
        type_acte_invasif,
        signature_requise,
        document_medical_id
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
   * Since there's no est_signe column, we mark signature_requise = false.
   *
   * @param {string} consentement_id - UUID of the `consentements` row.
   * @returns {Promise<object>} Updated consent record.
   */
  async markAsSigned(consentement_id) {
    const { data, error } = await supabase
      .from('consentements')
      .update({
        signature_requise: false
      })
      .eq('id', consentement_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Fetch all pending (required) consent forms.
   *
   * @returns {Promise<Array<object>>} Pending consents with nested exam data.
   */
  async fetchPendingConsentements() {
    const { data, error } = await supabase
      .from('consentements')
      .select(`
        *,
        examens:examen_id(id, statut, date_realisation, services:service_id(nom))
      `)
      .eq('signature_requise', true);
    if (error) throw error;
    return data || [];
  },
};
