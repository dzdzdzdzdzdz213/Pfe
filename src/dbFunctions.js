import { supabase } from './supabaseClient';

// ==========================================
// FONCTIONS POUR L'AUTHENTIFICATION
// ==========================================

export async function loginDoctor(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error) {
    console.error("Erreur de connexion:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data };
}

export async function logoutDoctor() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Erreur déconnexion:", error.message);
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ==========================================
// FONCTIONS POUR LES PATIENTS
// ==========================================

export async function getPatients() {
  const { data, error } = await supabase.from('patients').select('*');
  if (error) {
    console.error("Erreur lors de la récupération des patients:", error);
    return [];
  }
  return data;
}

export async function addPatient(patientData) {
  const { data, error } = await supabase.from('patients').insert([patientData]).select();
  if (error) {
    console.error("Erreur lors de l'ajout d'un patient:", error);
    return null;
  }
  return data;
}

// ==========================================
// FONCTIONS POUR LES RADIOLOGUES
// ==========================================

export async function getRadiologists() {
  const { data, error } = await supabase.from('radiologists').select('*');
  if (error) {
    console.error("Erreur lors de la récupération des radiologues:", error);
    return [];
  }
  return data;
}

// ==========================================
// FONCTIONS POUR LES SCANS (EXAMENS)
// ==========================================

export async function getScansForPatient(patientId) {
  const { data, error } = await supabase.from('scans').select('*').eq('patient_id', patientId);
  if (error) {
    console.error("Erreur lors de la récupération des scans:", error);
    return [];
  }
  return data;
}

export async function addScan(scanData) {
  const { data, error } = await supabase.from('scans').insert([scanData]).select();
  if (error) {
    console.error("Erreur lors de l'ajout d'un scan:", error);
    return null;
  }
  return data;
}

// ==========================================
// FONCTIONS POUR LES RAPPORTS
// ==========================================

export async function getReportsForScan(scanId) {
  const { data, error } = await supabase.from('reports').select('*').eq('scan_id', scanId);
  if (error) {
    console.error("Erreur lors de la récupération des rapports:", error);
    return [];
  }
  return data;
}
