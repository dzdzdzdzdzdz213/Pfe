import { supabase } from '../lib/supabase';
import { isDemoMode, getMockData, saveMockData } from '../lib/demo';

export const userService = {
  async fetchUsers() {
    if (isDemoMode()) {
      const mockUsers = getMockData('users', []);
      if (mockUsers.length === 0) {
        mockUsers.push({ id: 'admin-1', nom: 'Démo', prenom: 'Administrateur', email: 'admin@demo.com', role: 'administrateur', telephone: '0555123456', date_creation_compte: new Date().toISOString() });
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
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return newUser;
    }

    const { nom, prenom, email, telephone, role, password, ...rest } = userData;

    // Create user in Auth
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Create user in utilisateur table
    const { data: user, error: userError } = await supabase
      .from('utilisateurs')
      .insert({
        id: authUser.user.id,
        nom,
        prenom,
        email,
        telephone,
        role,
      })
      .select()
      .single();

    if (userError) throw userError;

    // Handle role-specific tables
    if (role === 'radiologue') {
      const { error: roleError } = await supabase
        .from('radiologues')
        .insert({
          utilisateur_id: user.id,
          matricule_sante: rest.matricule_sante,
          specialite_principale: rest.specialite_principale,
        });
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

  async deleteUser(id) {
    if (isDemoMode()) {
      let mockUsers = getMockData('users', []);
      mockUsers = mockUsers.filter(u => u.id !== id);
      saveMockData('users', mockUsers);
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    }

    // Note: This would typically be a soft delete or handle cascade in the DB
    const { error } = await supabase
      .from('utilisateurs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

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

  async fetchStaff() {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .neq('role', 'patient');
    if (error) throw error;
    return data;
  }
};
