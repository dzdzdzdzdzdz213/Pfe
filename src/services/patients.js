import { supabase } from '../lib/supabase';

/**
 * @fileoverview Patient service — CRUD operations for the `patients` table,
 * joined with `utilisateurs`.
 *
 * All functions throw on Supabase error so callers can catch via TanStack Query
 * `onError` or try/catch.
 */

export const patientService = {
  /**
   * Fetch all patients with their linked user profile.
   *
   * @returns {Promise<Array<{
   *   id: string,
   *   utilisateur_id: string,
   *   groupe_sanguin?: string,
   *   allergies?: string,
   *   antecedents_medicaux?: string,
   *   utilisateur: { nom: string, prenom: string, email: string, telephone: string }
   * }>>} Array of patient records.
   */
  async fetchPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        utilisateur:utilisateurs(nom, prenom, email, telephone)
      `);
    if (error) throw error;
    return data;
  },

  /**
   * Fetch a single patient by ID, including their user profile, medical dossier,
   * and linked appointments.
   *
   * @param {string} id - UUID of the patient row.
   * @returns {Promise<object>} Full patient record with nested relations.
   */
  async fetchPatientById(id) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        utilisateur:utilisateurs(*),
        dossier:dossiers_medicaux(*),
        appointments:rendez_vous(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Create a patient together with their `utilisateurs` row.
   * If an email is provided, sends an invitation email via Supabase Auth so
   * the patient can confirm their account and set a password.
   *
   * @param {object} patientData - Columns for the `patients` table.
   * @param {{ nom: string, prenom: string, email?: string, telephone?: string }} utilisateurData
   * @returns {Promise<{ user: object, patient: object }>}
   */
  async createPatient(patientData, utilisateurData) {
    let authId = null;

    // If email is provided, create an auth account → Supabase sends a confirmation email
    if (utilisateurData.email) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: utilisateurData.email,
        password: Math.random().toString(36).slice(-12) + 'A1!', // random temp password
        options: {
          data: {
            nom: utilisateurData.nom,
            prenom: utilisateurData.prenom,
            role: 'patient',
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) throw authError;
      authId = authData?.user?.id || null;
    }

    // Insert utilisateurs row, linking auth_id if we have one
    const { data: user, error: userError } = await supabase
      .from('utilisateurs')
      .insert({ ...utilisateurData, role: 'patient', profil_complet: false, auth_id: authId })
      .select()
      .single();

    if (userError) throw userError;

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({ ...patientData, utilisateur_id: user.id })
      .select()
      .single();

    if (patientError) throw patientError;

    // Auto-create dossier_medical (the DB trigger handles it too, this is a safety net)
    await supabase
      .from('dossiers_medicaux')
      .insert({ patient_id: patient.id })
      .select('id')
      .maybeSingle();

    return { user, patient };
  },

  /**
   * Update a patient row and its linked `utilisateurs` row simultaneously.
   *
   * @param {string} id - UUID of the `patients` row.
   * @param {object} updates - Columns to update in `patients`.
   * @param {string} userId - UUID of the linked `utilisateurs` row.
   * @param {object} userUpdates - Columns to update in `utilisateurs`.
   * @returns {Promise<{ user: object, patient: object }>} Updated records.
   */
  async updatePatient(id, updates, userId, userUpdates) {
    const { data: user, error: userError } = await supabase
      .from('utilisateurs')
      .update(userUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (userError) throw userError;

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (patientError) throw patientError;
    return { user, patient };
  },

  /**
   * Full-text patient search across `nom`, `prenom`, `email`, and `telephone`.
   * Performs a two-step join: first finds matching `utilisateurs` IDs, then
   * fetches corresponding `patients` rows.
   *
   * @param {string} query - Free-text search string (minimum 1 character).
   * @returns {Promise<Array<object>>} Matching patient records with joined user data.
   */
  async searchPatients(query) {
    if (!query || !query.trim()) return [];
    
    const terms = query.trim().split(/\s+/).filter(Boolean);
    const orConditions = terms.map(t => 
      `nom.ilike.%${t}%,prenom.ilike.%${t}%,email.ilike.%${t}%,telephone.ilike.%${t}%`
    ).join(',');

    try {
      const { data: users, error: userError } = await supabase
        .from('utilisateurs')
        .select('id')
        .or(orConditions);

      if (userError) throw userError;
      const userIds = (users || []).map(u => u.id);

      if (userIds.length === 0) return [];

      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          utilisateur:utilisateurs(nom, prenom, email, telephone)
        `)
        .in('utilisateur_id', userIds);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Patient search service error:', err);
      return [];
    }
  },

  /**
   * Delete a patient and their primary user account.
   *
   * @param {string} patientId - UUID of the `patients` row.
   * @param {string} userId - UUID of the `utilisateurs` row.
   * @returns {Promise<boolean>} True on success.
   */
  async deletePatient(patientId, userId) {
    // Delete patient row first
    const { error: patientError } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId);
    if (patientError) throw patientError;

    // Delete user row
    const { error: userError } = await supabase
      .from('utilisateurs')
      .delete()
      .eq('id', userId);
    if (userError) throw userError;

    return true;
  }
};
