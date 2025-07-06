
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, X, Settings, Users, MessageCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  day: string;
}

interface Notification {
  id: string;
  type: 'task' | 'team' | 'partner' | 'system' | 'invite';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks?: Task[];
}

const NotificationPanel = ({ isOpen, onClose, tasks = [] }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch real notifications from database
      const notifications: Notification[] = [];
      
      // Add task reminders
      const pendingTasks = tasks.filter(task => !task.completed);
      if (pendingTasks.length > 0) {
        notifications.push({
          id: 'task-reminder',
          type: 'task',
          title: 'Task reminder',
          message: `You have ${pendingTasks.length} pending tasks`,
          timestamp: new Date(),
          read: false
        });
      }

      // Fetch team invitations
      const { data: teamInvites } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          role,
          teams:team_id (name)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (teamInvites) {
        teamInvites.forEach(invite => {
          notifications.push({
            id: `team-invite-${invite.id}`,
            type: 'team',
            title: 'Team invitation',
            message: `You've been added to team "${invite.teams?.name}"`,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
            read: false,
            metadata: { teamId: invite.team_id }
          });
        });
      }

      // Fetch partner invitations
      const { data: partnerInvites } = await supabase
        .from('partners')
        .select('*')
        .eq('status', 'pending');

      if (partnerInvites) {
        partnerInvites.forEach(invite => {
          notifications.push({
            id: `partner-invite-${invite.id}`,
            type: 'partner',
            title: 'Partner invitation',
            message: `Partnership request from ${invite.partner_email}`,
            timestamp: new Date(invite.created_at),
            read: false,
            metadata: { partnerId: invite.id }
          });
        });
      }

      // Add system notifications
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_streak')
          .eq('id', user.id)
          .single();

        if (profile && profile.current_streak > 0 && profile.current_streak % 7 === 0) {
          notifications.push({
            id: `streak-milestone-${profile.current_streak}`,
            type: 'system',
            title: 'Streak milestone!',
            message: `Congratulations! You've reached a ${profile.current_streak}-day streak`,
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
            read: false
          });
        }
      }

      // Sort by timestamp (newest first)
      notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setNotifications(notifications.slice(0, 10)); // Limit to 10 notifications
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

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const handleNotificationAction = async (notification: Notification) => {
    if (notification.type === 'partner' && notification.metadata?.partnerId) {
      // Handle partner invitation acceptance
      try {
        await supabase
          .from('partners')
          .update({ status: 'accepted' })
          .eq('id', notification.metadata.partnerId);
        
        toast({
          title: "Partnership accepted!",
          description: "You're now connected with your accountability partner!",
        });
        
        deleteNotification(notification.id);
      } catch (error: any) {
        toast({
          title: "Error accepting partnership",
          description: error.message,
          variant: "destructive",
        });
      }
    }
    
    markAsRead(notification.id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'partner':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'task':
        return <Bell className="w-4 h-4 text-orange-500" />;
      case 'system':
        return <Settings className="w-4 h-4 text-purple-500" />;
      case 'invite':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
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
      <Card className="w-full max-w-md mx-4 max-h-[80vh] bg-white dark:bg-gray-800 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-purple-600" />
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
              className="self-start text-purple-600 hover:text-purple-700"
            >
              Mark all as read
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
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
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-500' : ''
                    }`}
                    onClick={() => handleNotificationAction(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {!notification.read && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
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

export default NotificationPanel;
