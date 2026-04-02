import { supabase } from '../lib/supabase';

export const patientService = {
  async fetchPatients() {
    const { data, error } = await supabase
      .from('patient')
      .select(`
        *,
        utilisateur:utilisateur_id(nom, prenom, email, telephone)
      `);
    if (error) throw error;
    return data;
  },

  async fetchPatientById(id) {
    const { data, error } = await supabase
      .from('patient')
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
      .from('utilisateur')
      .insert({ ...utilisateurData, role: 'patient' })
      .select()
      .single();

    if (userError) throw userError;

    const { data: patient, error: patientError } = await supabase
      .from('patient')
      .insert({ ...patientData, utilisateur_id: user.id })
      .select()
      .single();

    if (patientError) throw patientError;
    return { user, patient };
  },

  async updatePatient(id, updates, userId, userUpdates) {
    const { data: user, error: userError } = await supabase
      .from('utilisateur')
      .update(userUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (userError) throw userError;

    const { data: patient, error: patientError } = await supabase
      .from('patient')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (patientError) throw patientError;
    return { user, patient };
  },

  async searchPatients(query) {
    const { data, error } = await supabase
      .from('patient')
      .select(`
        *,
        utilisateur:utilisateur_id(nom, prenom, email, telephone)
      `)
      .or(`utilisateur.nom.ilike.%${query}%,utilisateur.prenom.ilike.%${query}%,utilisateur.email.ilike.%${query}%,utilisateur.telephone.ilike.%${query}%`);
    
    if (error) throw error;
    return data;
  }
};
