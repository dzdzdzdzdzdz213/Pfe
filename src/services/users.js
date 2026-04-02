import { supabase } from '../lib/supabase';

const isDemoMode = () => !!localStorage.getItem('demo_mock_session');

export const userService = {
  async fetchUsers() {
    if (isDemoMode()) {
      const mockUsers = JSON.parse(localStorage.getItem('demo_mock_users') || '[]');
      if (mockUsers.length === 0) {
        mockUsers.push({ id: 'admin-1', nom: 'Démo', prenom: 'Administrateur', email: 'admin@demo.com', role: 'administrateur', telephone: '0555123456', dateCreationCompte: new Date().toISOString() });
        localStorage.setItem('demo_mock_users', JSON.stringify(mockUsers));
      }
      return mockUsers;
    }

    const { data, error } = await supabase
      .from('utilisateur')
      .select(`
        *,
        radiologue:radiologue_id(id, matricule_sante, specialite_principale),
        receptionniste:receptionniste_id(id),
        administrateur:administrateur_id(id)
      `);
    if (error) throw error;
    return data;
  },

  async createUser(userData) {
    if (isDemoMode()) {
      const mockUsers = JSON.parse(localStorage.getItem('demo_mock_users') || '[]');
      const newUser = { 
        ...userData, 
        id: 'mock-' + Date.now(), 
        dateCreationCompte: new Date().toISOString() 
      };
      mockUsers.push(newUser);
      localStorage.setItem('demo_mock_users', JSON.stringify(mockUsers));
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
      .from('utilisateur')
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
        .from('radiologue')
        .insert({
          utilisateur_id: user.id,
          matricule_sante: rest.matricule_sante,
          specialite_principale: rest.specialite_principale,
        });
      if (roleError) throw roleError;
    } else if (role === 'receptionniste') {
      const { error: roleError } = await supabase
        .from('receptionniste')
        .insert({ utilisateur_id: user.id });
      if (roleError) throw roleError;
    } else if (role === 'administrateur') {
      const { error: roleError } = await supabase
        .from('administrateur')
        .insert({ utilisateur_id: user.id });
      if (roleError) throw roleError;
    }

    return user;
  },

  async updateUser(id, updates) {
    if (isDemoMode()) {
      let mockUsers = JSON.parse(localStorage.getItem('demo_mock_users') || '[]');
      mockUsers = mockUsers.map(u => u.id === id ? { ...u, ...updates } : u);
      localStorage.setItem('demo_mock_users', JSON.stringify(mockUsers));
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockUsers.find(u => u.id === id);
    }

    const { data, error } = await supabase
      .from('utilisateur')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteUser(id) {
    if (isDemoMode()) {
      let mockUsers = JSON.parse(localStorage.getItem('demo_mock_users') || '[]');
      mockUsers = mockUsers.filter(u => u.id !== id);
      localStorage.setItem('demo_mock_users', JSON.stringify(mockUsers));
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    }

    // Note: This would typically be a soft delete or handle cascade in the DB
    const { error } = await supabase
      .from('utilisateur')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async fetchUserById(id) {
    const { data, error } = await supabase
      .from('utilisateur')
      .select(`
        *,
        radiologue:radiologue_id(*),
        receptionniste:receptionniste_id(*),
        administrateur:administrateur_id(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async fetchStaff() {
    const { data, error } = await supabase
      .from('utilisateur')
      .select('*')
      .neq('role', 'patient');
    if (error) throw error;
    return data;
  }
};
