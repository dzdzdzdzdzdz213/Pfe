import { supabase } from '../lib/supabase';

export const auditService = {
  async fetchAuditLogs(options = {}) {
    let query = supabase
      .from('audit_log')
      .select(`
        *,
        utilisateur:utilisateur_id(nom, prenom, email, role)
      `);

    if (options.startDate && options.endDate) {
      query = query.gte('date_action', options.startDate).lte('date_action', options.endDate);
    }

    if (options.role) {
      query = query.eq('utilisateur.role', options.role);
    }

    if (options.action) {
      query = query.ilike('action', `%${options.action}%`);
    }

    const { data, error } = await query.order('date_action', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createAuditLog(action, details, userId) {
    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        action,
        details,
        utilisateur_id: userId,
        date_action: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
