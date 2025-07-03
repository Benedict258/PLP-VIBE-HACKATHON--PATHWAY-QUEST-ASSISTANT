
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Settings, Download } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import TaskForm from './TaskForm';
import ScheduleBoard from './ScheduleBoard';
import ProgressSummary from './ProgressSummary';
import NotificationPanel from './NotificationPanel';
import SettingsPanel from './SettingsPanel';
import StreakCounter from './StreakCounter';
import PWAInstallPrompt from './PWAInstallPrompt';

interface Task {
  id: string;
  name: string;
  category: string;
  day: string;
  completed: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  name: string;
  current_streak: number;
}

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  const { sendNotification } = useNotifications();

  useEffect(() => {
    getCurrentUser();
    fetchTasks();
    fetchProfile();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
      
      // Check for pending tasks and send notifications
      const pendingTasks = data?.filter(task => !task.completed) || [];
      if (pendingTasks.length > 0) {
        const nextTask = pendingTasks[0];
        sendNotification(
          'Task Reminder',
          `Don't forget: ${nextTask.name} (${nextTask.day})`,
          { icon: '/icon-192.png' }
        );
      }
    } catch (error: any) {
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async () => {
    // Update streak when task is completed
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('update_user_streak', { user_uuid: user.id });
        fetchProfile(); // Refresh profile to get updated streak
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
    fetchTasks();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 dark:text-purple-300 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-purple-200 dark:border-purple-700 shadow-sm sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">PQ</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Pathway Quest
                  </h1>
                  {profile && (
                    <p className="text-sm text-purple-600 dark:text-purple-300">
                      Welcome back, {profile.name}! 👋
                    </p>
                  )}
                </div>
              </div>
              
              {user && (
                <div className="hidden md:flex items-center gap-2 text-sm text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-700">
                  <User className="w-4 h-4" />
                  {user.email}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSettings(true)}
                variant="ghost"
                size="sm"
                className="text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Streak Counter */}
            {profile && (
              <StreakCounter streak={profile.current_streak} />
            )}
            
            {/* Schedule Board */}
            <ScheduleBoard tasks={tasks} onTasksChange={handleTaskComplete} />
            
            {/* Notifications Panel */}
            <NotificationPanel tasks={tasks} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Task Form */}
            <TaskForm onTaskAdded={fetchTasks} />
            
            {/* Progress Summary */}
            <ProgressSummary tasks={tasks} />
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default Dashboard;
