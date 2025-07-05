
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationsContextType {
  notificationsEnabled: boolean;
  permission: NotificationPermission;
  toggleNotifications: (enabled: boolean) => Promise<boolean>;
  sendNotification: (title: string, body: string, options?: NotificationOptions) => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check current permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load user notification preference
    loadNotificationPreference();
  }, []);

  const loadNotificationPreference = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('notifications_enabled')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setNotificationsEnabled(profile.notifications_enabled);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    }
    return false;
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }

    setNotificationsEnabled(enabled);

    // Update in database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ notifications_enabled: enabled })
        .eq('id', user.id);
    }

    return true;
  };

  const sendNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (notificationsEnabled && permission === 'granted') {
      new Notification(title, { body, ...options });
    }
  };

  const value = {
    notificationsEnabled,
    permission,
    toggleNotifications,
    sendNotification,
    requestNotificationPermission
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
