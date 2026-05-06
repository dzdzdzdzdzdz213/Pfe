import { supabase } from '../lib/supabase';

/**
 * @fileoverview User service — admin CRUD for the `utilisateurs` table.
 *
 * When creating a non-patient user, Supabase Auth is invoked first so the
 * resulting `utilisateurs.id` matches `auth.users.id`. Role-specific tables
 * (`radiologues`, `receptionnistes`, `administrateurs`) are populated
 * automatically based on the `role` field.
 *
 * Demo mode stores data in `localStorage` and simulates async delays.
 */

export const userService = {
  /**
   * Fetch all utilisateurs with their role-specific profile rows joined.
   * Radiologue-specific fields (`matricule_sante`, `specialite_principale`) are
   * included via the `radiologue` join.
   *
   * @returns {Promise<Array<{
   *   id: string,
   *   nom: string,
   *   prenom: string,
   *   email: string,
   *   telephone?: string,
   *   role: 'administrateur'|'radiologue'|'receptionniste'|'patient',
   *   radiologue?: { matricule_sante: string, specialite_principale: string },
   *   receptionniste?: object,
   *   administrateur?: object
   * }>>} All users with nested role profiles.
   */
  async fetchUsers() {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select(`
        *,
        radiologue:radiologues(id, matricule_sante, specialite_principale),
        receptionniste:receptionnistes(id),
        administrateur:administrateurs(id)
      `);
    if (error) throw error;
    return data;
  },

  /**
   * Create a new staff user (non-patient).
   * Steps:
   *   1. Calls `supabase.auth.signUp` to create an Auth user.
   *   2. Inserts a row in `utilisateurs` with the Auth UUID as primary key.
   *   3. Inserts into the role-specific table (`radiologues`, `receptionnistes`,
   *      or `administrateurs`).
   *
   * In demo mode, a mock row is saved to `localStorage` with a generated UUID.
   *
   * @param {{
   *   nom: string,
   *   prenom: string,
   *   email: string,
   *   telephone?: string,
   *   role: 'radiologue'|'receptionniste'|'administrateur'|'admin',
   *   password: string,
   *   date_naissance?: string,
   *   sexe?: 'M'|'F',
   *   matricule_sante?: string,
   *   specialite_principale?: string
   * }} userData - Combined utilisateur + role-specific data.
   * @returns {Promise<object>} The created `utilisateurs` row.
   */
  async createUser(userData) {
    const { nom, prenom, email, telephone, role, password, ...rest } = userData;

    // Step 1: Auth signup (This creates the record in auth.users)
    const { data: authUser, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { nom, prenom, role }
      }
    });
    if (authError) throw authError;
    if (!authUser.user) throw new Error("Erreur lors de la création du compte d'authentification");

    // Step 2 & 3: Atomic creation via Security Definer RPC
    const { error: rpcError } = await supabase.rpc('create_staff_user', {
      p_id: authUser.user.id,
      p_nom: nom,
      p_prenom: prenom,
      p_email: email,
      p_telephone: telephone,
      p_role: role,
      p_date_naissance: rest.date_naissance || null,
      p_sexe: rest.sexe || 'M',
      p_matricule_sante: rest.matricule_sante || null,
      p_specialite_principale: rest.specialite_principale || null
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      throw new Error(`Erreur lors de la création du profil: ${rpcError.message}`);
    }

    return { id: authUser.user.id, email, nom, prenom, role };
  },

  /**
   * Update an existing user's profile fields in `utilisateurs`.
   * Does NOT update Auth email or password — those require separate Auth API calls.
   *
   * @param {string} id - UUID of the `utilisateurs` row.
   * @param {Partial<{ nom: string, prenom: string, telephone: string }>} updates
   *   Fields to update (email and role changes must be handled separately).
   * @returns {Promise<object>} Updated utilisateurs row.
   */
  async updateUser(id, updates) {
    if (updates.role) {
      const { error: rpcError } = await supabase.rpc('switch_user_role', {
        p_user_id: id,
        p_new_role: updates.role
      });
      if (rpcError) throw rpcError;
    }

    const { nom, prenom, telephone, date_naissance, sexe } = updates;
    const cleanUpdates = { nom, prenom, telephone, date_naissance, sexe };
    
    const { data, error } = await supabase
      .from('utilisateurs')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Delete a user by ID.
   * ⚠️ In production this should be a soft-delete or handled via a Supabase
   * Edge Function that also removes the Auth user and cascades role tables.
   *
   * @param {string} id - UUID of the `utilisateurs` row.
   * @returns {Promise<true>} Returns `true` on successful deletion.
   */
  async deleteUser(id) {
    // Delete from role-specific tables first to maintain referential integrity
    await Promise.all([
      supabase.from('administrateurs').delete().eq('utilisateur_id', id),
      supabase.from('radiologues').delete().eq('utilisateur_id', id),
      supabase.from('receptionnistes').delete().eq('utilisateur_id', id),
      supabase.from('patients').delete().eq('utilisateur_id', id)
    ]);

    // Finally delete from utilisateurs
    const { error } = await supabase
      .from('utilisateurs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  /**
   * Fetch a single user with all role-specific profile rows joined.
   *
   * @param {string} id - UUID of the `utilisateurs` row.
   * @returns {Promise<object>} User with nested `radiologue`, `receptionniste`,
   *   and `administrateur` profile objects (each may be `null`).
   */
  async fetchUserById(id) {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select(`
        *,
        radiologue:radiologues(*),
        receptionniste:receptionnistes(*),
        administrateur:administrateurs(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Fetch all non-patient staff members (radiologues, receptionnistes, administrateurs).
   * Used when building dropdowns for appointment assignment.
   *
   * @returns {Promise<Array<object>>} Staff utilisateurs rows (no role-table joins).
   */
  async fetchStaff() {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .neq('role', 'patient');
    if (error) throw error;
    return data;
  }
};
