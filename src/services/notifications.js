import { supabase } from '../lib/supabase';

export const notificationService = {
  async fetchNotifications(userId) {
    const { data, error } = await supabase
      .from('notification')
      .select('*')
      .eq('utilisateur_id', userId)
      .order('date_envoi', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markAsRead(id) {
    const { data, error } = await supabase
      .from('notification')
      .update({ lu: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createNotification(notification) {
    const { data, error } = await supabase
      .from('notification')
      .insert({
        ...notification,
        date_envoi: new Date().toISOString(),
        lu: false,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async fetchUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notification')
      .select('*', { count: 'exact', head: true })
      .eq('utilisateur_id', userId)
      .eq('lu', false);
    if (error) throw error;
    return count || 0;
  },

  subscribeToNotifications(userId, onNotification) {
    return supabase
      .channel('public:notification')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notification', 
        filter: `utilisateur_id=eq.${userId}` 
      }, (payload) => {
        onNotification(payload.new);
      })
      .subscribe();
  }
};
