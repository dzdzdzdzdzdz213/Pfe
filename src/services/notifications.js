import { supabase } from '../lib/supabase';

/**
 * @fileoverview Notification service — CRUD and real-time subscription for
 * the `notifications` table.
 *
 * Notifications are keyed by `utilisateur_id`. The `lu` boolean tracks
 * read/unread state, and `date_envoi` stores the ISO timestamp.
 */

export const notificationService = {
  /**
   * Fetch all notifications for a user, newest first.
   *
   * @param {string} userId - UUID from `auth.users` (= `utilisateurs.id`).
   * @returns {Promise<Array<{
   *   id: string,
   *   contenu: string,
   *   lu: boolean,
   *   date_envoi: string,
   *   utilisateur_id: string
   * }>>} Ordered notification list.
   */
  async fetchNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('utilisateur_id', userId)
      .order('date_envoi', { ascending: false });
    if (error) throw error;
    return data;
  },

  /**
   * Mark a single notification as read.
   *
   * @param {string} id - UUID of the notification row.
   * @returns {Promise<object>} Updated notification row with `lu: true`.
   */
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

  /**
   * Create a new notification. `date_envoi` and `lu` are set automatically.
   *
   * @param {{ contenu: string, utilisateur_id: string, type?: string }} notification
   *   Notification payload. `type` is optional metadata (e.g. `'rdv'`, `'rapport'`).
   * @returns {Promise<object>} The created notification row.
   */
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

  /**
   * Get the count of unread notifications for a user.
   * Uses `count: 'exact'` with `head: true` to avoid fetching row data.
   *
   * @param {string} userId - UUID from `auth.users`.
   * @returns {Promise<number>} Number of unread notifications (0 if none).
   */
  async fetchUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('utilisateur_id', userId)
      .eq('lu', false);
    if (error) throw error;
    return count || 0;
  },

  /**
   * Subscribe to real-time INSERT events on `notifications` filtered by user.
   * Uses Supabase Realtime (Postgres Changes).
   *
   * @param {string} userId - UUID to filter notifications for.
   * @param {(notification: object) => void} onNotification
   *   Callback invoked with the new notification payload on each INSERT.
   * @returns {import('@supabase/supabase-js').RealtimeChannel}
   *   The active Realtime channel. Call `.unsubscribe()` on unmount.
   *
   * @example
   * useEffect(() => {
   *   const channel = notificationService.subscribeToNotifications(user.id, (n) => {
   *     toast.info(n.contenu);
   *   });
   *   return () => channel.unsubscribe();
   * }, [user.id]);
   */
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
