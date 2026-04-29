import { supabase } from '../lib/supabase';

export const auditService = {
  async fetchAuditLogs(options = {}) {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        utilisateur:utilisateurs!utilisateur_id(nom, prenom, email, role)
      `);

    if (options.startDate) {
      query = query.gte('date_action', options.startDate + 'T00:00:00');
    }
    if (options.endDate) {
      query = query.lte('date_action', options.endDate + 'T23:59:59');
    }

    if (options.action) {
      query = query.ilike('action', `%${options.action}%`);
    }

    const { data, error } = await query.order('date_action', { ascending: false }).limit(500);
    if (error) throw error;
    return data ?? [];
  },

  async createAuditLog(action, details, userId) {
    const { data, error } = await supabase
      .from('audit_logs')
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
