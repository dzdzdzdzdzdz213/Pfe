import React, { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink, X } from 'lucide-react';
import { notificationService } from '@/services/notifications';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export const NotificationBell = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      try {
        const data = await notificationService.fetchNotifications(user.id);
        setNotifications(data || []);
        const count = await notificationService.fetchUnreadCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Real-time subscription
    const channel = notificationService.subscribeToNotifications(user.id, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [user?.id]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-primary transition-all relative overflow-hidden group"
      >
        <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 9 ? t('nine_plus') : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-14 z-50 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">{t('notifications_title')}</h3>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.slice(0, 15).map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.lu ? 'bg-blue-50/30' : ''}`}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notif.lu ? 'bg-primary' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{notif.type}</p>
                        <p className="text-sm text-slate-700 font-medium mt-0.5 leading-relaxed">{notif.contenu}</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-1.5">{timeAgo(notif.date_envoi, lang)}</p>
                      </div>
                      {!notif.lu && (
                        <button className="p-1 rounded-full text-primary hover:bg-primary/10 transition-colors flex-shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">{t('notifications_none')}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
