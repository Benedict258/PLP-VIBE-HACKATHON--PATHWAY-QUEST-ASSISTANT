import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, X, Settings, Users, MessageCircle, Calendar, CheckSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: any;
  created_at: string;
}

interface EnhancedNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationCountChange: (count: number) => void;
}

const EnhancedNotificationPanel = ({ isOpen, onClose, onNotificationCountChange }: EnhancedNotificationPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      setupRealtimeSubscription();
    }
  }, [isOpen]);

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    onNotificationCountChange(unreadCount);
  }, [notifications, onNotificationCountChange]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get real notifications from database
      const { data: dbNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Add system-generated notifications
      const systemNotifications = await generateSystemNotifications(user.id);
      
      const allNotifications = [
        ...(dbNotifications || []),
        ...systemNotifications
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error loading notifications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSystemNotifications = async (userId: string) => {
    const systemNotifications: Notification[] = [];

    try {
      // Check for pending tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false);

      if (tasks && tasks.length > 0) {
        systemNotifications.push({
          id: `tasks-pending-${Date.now()}`,
          type: 'task_reminder',
          title: 'Pending Tasks',
          message: `You have ${tasks.length} pending task${tasks.length !== 1 ? 's' : ''} to complete`,
          read: false,
          created_at: new Date().toISOString(),
          data: { taskCount: tasks.length }
        });
      }

      // Check for today's events
      const today = new Date().toISOString().split('T')[0];
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today);

      if (events && events.length > 0) {
        events.forEach(event => {
          systemNotifications.push({
            id: `event-today-${event.id}`,
            type: 'event_today',
            title: 'Event Today',
            message: `"${event.title}" is scheduled for today${event.time ? ` at ${event.time}` : ''}`,
            read: false,
            created_at: new Date().toISOString(),
            data: { eventId: event.id, eventTitle: event.title }
          });
        });
      }

      // Check for team invites
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user?.email) return systemNotifications;

      const { data: teamInvites } = await supabase
        .from('invites')
        .select('*')
        .eq('receiver_email', userResponse.user.email)
        .eq('status', 'pending')
        .eq('type', 'team');

      if (teamInvites && teamInvites.length > 0) {
        teamInvites.forEach(invite => {
          systemNotifications.push({
            id: `team-invite-${invite.id}`,
            type: 'team_invite',
            title: 'Team Invitation',
            message: 'You have a pending team invitation',
            read: false,
            created_at: invite.created_at || new Date().toISOString(),
            data: { inviteId: invite.id }
          });
        });
      }

      // Check for partner invites
      const { data: partnerInvites } = await supabase
        .from('invites')
        .select('*')
        .eq('receiver_email', userResponse.user.email)
        .eq('status', 'pending')
        .eq('type', 'partner');

      if (partnerInvites && partnerInvites.length > 0) {
        partnerInvites.forEach(invite => {
          systemNotifications.push({
            id: `partner-invite-${invite.id}`,
            type: 'partner_invite',
            title: 'Partnership Request',
            message: 'You have a new partnership request',
            read: false,
            created_at: invite.created_at || new Date().toISOString(),
            data: { inviteId: invite.id }
          });
        });
      }

    } catch (error) {
      console.error('Error generating system notifications:', error);
    }

    return systemNotifications;
  };

  const setupRealtimeSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // If it's a database notification, update it
      if (!notificationId.includes('-pending-') && !notificationId.includes('-today-') && !notificationId.includes('-invite-')) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error: any) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_invite':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'partner_invite':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'task_reminder':
        return <CheckSquare className="w-4 h-4 text-orange-500" />;
      case 'event_today':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diff = now.getTime() - notifTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-4 sm:pt-16">
      <Card className="w-full max-w-md mx-4 max-h-[80vh] bg-white shadow-2xl border-blue-200">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="ghost"
              size="sm"
              className="self-start text-blue-600 hover:text-blue-700"
            >
              Mark all as read
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimestamp(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {!notification.read && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedNotificationPanel;
