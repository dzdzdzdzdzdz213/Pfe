import { supabase } from '../lib/supabase';

/**
 * @fileoverview Report service — CRUD operations for the `comptes_rendus` table.
 *
 * Reports are linked to examens through `documents_medicaux` (via `document_medical_id`)
 * and authored by a `radiologue`. The `est_valide` boolean marks a finalized,
 * patient-visible report.
 */

export const reportService = {
  /**
   * Fetch reports with optional filters. Returns reports joined with the
   * authoring radiologue's user profile and the linked medical document.
   *
   * @param {{ radiologueId?: string, estValide?: boolean }} [options={}]
   *   - `radiologueId`: Limit to reports authored by this radiologue UUID.
   *   - `estValide`: If `true`, only return finalized reports; `false` for drafts.
   * @returns {Promise<Array<object>>} Array of compte-rendu rows with nested joins.
   */
  async fetchReports(options = {}) {
    let query = supabase
      .from('comptes_rendus')
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

  /**
   * Create a new compte-rendu (report) row.
   *
   * @param {{
   *   description_detaillee: string,
   *   radiologue_id: string,
   *   document_medical_id?: string,
   *   est_valide?: boolean
   * }} reportData - Fields to insert into `comptes_rendus`.
   * @returns {Promise<object>} The created report row.
   */
  async createReport(reportData) {
    const { examen_id, ...reportFields } = reportData;

    // Find or create documents_medicaux for this exam
    let docId = null;
    let dossierId = null;

    if (examen_id) {
      // Find the patient's dossier_medical via rendez_vous
      const { data: rdv } = await supabase
        .from('rendez_vous')
        .select('patient_id')
        .eq('examen_id', examen_id)
        .maybeSingle();

      if (rdv?.patient_id) {
        const { data: dossier } = await supabase
          .from('dossiers_medicaux')
          .select('id')
          .eq('patient_id', rdv.patient_id)
          .maybeSingle();

        if (dossier) {
          dossierId = dossier.id;
        } else {
          // Auto-create dossier if missing
          const { data: newDossier } = await supabase
            .from('dossiers_medicaux')
            .insert({ patient_id: rdv.patient_id })
            .select('id')
            .single();
          if (newDossier) dossierId = newDossier.id;
        }
      }

      const { data: existingDoc } = await supabase
        .from('documents_medicaux')
        .select('id')
        .eq('examen_id', examen_id)
        .maybeSingle();

      if (existingDoc) {
        docId = existingDoc.id;
        // Update dossier_id if not yet set
        if (dossierId) {
          await supabase
            .from('documents_medicaux')
            .update({ dossier_id: dossierId })
            .eq('id', docId);
        }
      } else {
        const { data: newDoc, error: docError } = await supabase
          .from('documents_medicaux')
          .insert({
            examen_id,
            dossier_id: dossierId,
            statut: 'valide',
            date_creation: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();
        if (docError) throw docError;
        docId = newDoc.id;
      }
    }

    const { data, error } = await supabase
      .from('comptes_rendus')
      .insert({ ...reportFields, document_medical_id: docId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Partially update a report by ID.
   *
   * @param {string} id - UUID of the `comptes_rendus` row.
   * @param {Partial<{ description_detaillee: string, est_valide: boolean }>} updates
   *   Columns to update. Only specified keys are sent to Supabase.
   * @returns {Promise<object>} The updated report row.
   */
  async updateReport(id, updates) {
    const { data, error } = await supabase
      .from('comptes_rendus')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Mark a report as validated (`est_valide = true`), making it visible to the patient.
   *
   * @param {string} id - UUID of the `comptes_rendus` row.
   * @returns {Promise<object>} Updated report row with `est_valide: true`.
   */
  async validateReport(id) {
    return this.updateReport(id, { est_valide: true });
  },

  /**
   * Fetch a single report by ID with full nesting:
   * radiologue profile → linked document → linked exam → patient demographics.
   * Used exclusively in `ReportEditor` for the print view.
   *
   * @param {string} id - UUID of the `comptes_rendus` row.
   * @returns {Promise<object>} Deeply nested report object.
   */
  async fetchReportById(id) {
    const { data, error } = await supabase
      .from('comptes_rendus')
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
