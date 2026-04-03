import { supabase } from '../lib/supabase';

export const notificationService = {
  async fetchNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('utilisateur_id', userId)
      .order('date_envoi', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markAsRead(id) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createNotification(notification) {
    const { data, error } = await supabase
      .from('notifications')
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
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('utilisateur_id', userId)
      .eq('lu', false);
    if (error) throw error;
    return count || 0;
  },

  subscribeToNotifications(userId, onNotification) {
    return supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `utilisateur_id=eq.${userId}` 
      }, (payload) => {
        onNotification(payload.new);
      })
      .subscribe();
  }
};
