import { supabase } from '../lib/supabase';
import { isDemoMode, getMockData, saveMockData } from '../lib/demo';

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
    if (isDemoMode()) {
      const mockUsers = getMockData('users', []);
      if (mockUsers.length === 0) {
        mockUsers.push({
          id: 'admin-1',
          nom: 'Démo',
          prenom: 'Administrateur',
          email: 'admin@demo.com',
          role: 'administrateur',
          telephone: '0555123456',
          date_creation_compte: new Date().toISOString()
        });
        saveMockData('users', mockUsers);
      }
      return mockUsers;
    }

    const { data, error } = await supabase
      .from('utilisateurs')
      .select(`
        *,
        radiologue:radiologues!utilisateur_id(id, matricule_sante, specialite_principale),
        receptionniste:receptionnistes!utilisateur_id(id),
        administrateur:administrateurs!utilisateur_id(id)
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
   *   role: 'radiologue'|'receptionniste'|'administrateur',
   *   password: string,
   *   matricule_sante?: string,
   *   specialite_principale?: string
   * }} userData - Combined utilisateur + role-specific data.
   * @returns {Promise<object>} The created `utilisateurs` row.
   */
  async createUser(userData) {
    if (isDemoMode()) {
      const mockUsers = getMockData('users', []);
      const newUser = {
        ...userData,
        id: 'mock-' + Date.now(),
        date_creation_compte: new Date().toISOString()
      };
      mockUsers.push(newUser);
      saveMockData('users', mockUsers);
      await new Promise(resolve => setTimeout(resolve, 500));
      return newUser;
    }

    const { nom, prenom, email, telephone, role, password, ...rest } = userData;

    // Step 1: Auth signup
    const { data: authUser, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    // Step 2: utilisateurs row (id matches auth.users.id)
    const { data: user, error: userError } = await supabase
      .from('utilisateurs')
      .insert({ id: authUser.user.id, nom, prenom, email, telephone, role })
      .select()
      .single();
    if (userError) throw userError;

    // Step 3: Role-specific table
    if (role === 'radiologue') {
      const { error: roleError } = await supabase
        .from('radiologues')
        .insert({ utilisateur_id: user.id, matricule_sante: rest.matricule_sante, specialite_principale: rest.specialite_principale });
      if (roleError) throw roleError;
    } else if (role === 'receptionniste') {
      const { error: roleError } = await supabase
        .from('receptionnistes')
        .insert({ utilisateur_id: user.id });
      if (roleError) throw roleError;
    } else if (role === 'administrateur') {
      const { error: roleError } = await supabase
        .from('administrateurs')
        .insert({ utilisateur_id: user.id });
      if (roleError) throw roleError;
    }

    return user;
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
    if (isDemoMode()) {
      let mockUsers = getMockData('users', []);
      mockUsers = mockUsers.map(u => u.id === id ? { ...u, ...updates } : u);
      saveMockData('users', mockUsers);
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockUsers.find(u => u.id === id);
    }

    const { data, error } = await supabase
      .from('utilisateurs')
      .update(updates)
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
    if (isDemoMode()) {
      let mockUsers = getMockData('users', []);
      mockUsers = mockUsers.filter(u => u.id !== id);
      saveMockData('users', mockUsers);
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    }

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
        radiologue:radiologues!utilisateur_id(*),
        receptionniste:receptionnistes!utilisateur_id(*),
        administrateur:administrateurs!utilisateur_id(*)
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
