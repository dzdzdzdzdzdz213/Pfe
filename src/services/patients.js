import { supabase } from '../lib/supabase';

export const patientService = {
  async fetchPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        utilisateur:utilisateur_id(nom, prenom, email, telephone)
      `);
    if (error) throw error;
    return data;
  },

  async fetchPatientById(id) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        utilisateur:utilisateur_id(*),
        dossier:dossier_medical(*),
        appointments:rendez_vous(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createPatient(patientData, utilisateurData) {
    const { data: user, error: userError } = await supabase
      .from('utilisateurs')
      .insert({ ...utilisateurData, role: 'patient' })
      .select()
      .single();

    if (userError) throw userError;

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({ ...patientData, utilisateur_id: user.id })
      .select()
      .single();

    if (patientError) throw patientError;
    return { user, patient };
  },

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

  async searchPatients(query) {
    const { data: users, error: userError } = await supabase
      .from('utilisateurs')
      .select('id')
      .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,email.ilike.%${query}%,telephone.ilike.%${query}%`);
      
    if (userError) throw userError;
    const userIds = users.map(u => u.id);

    if (userIds.length === 0) return [];

    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        utilisateur:utilisateur_id(nom, prenom, email, telephone)
      `)
      .in('utilisateur_id', userIds);
    
    if (error) throw error;
    return data;
  }
};
