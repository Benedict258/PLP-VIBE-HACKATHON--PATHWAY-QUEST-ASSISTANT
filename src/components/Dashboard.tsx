
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Settings, Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import TaskForm from './TaskForm';
import ScheduleBoard from './ScheduleBoard';
import ProgressSummary from './ProgressSummary';
import NotificationPanel from './NotificationPanel';
import EnhancedSettingsPanel from './EnhancedSettingsPanel';
import StreakCounter from './StreakCounter';
import PWAInstallPrompt from './PWAInstallPrompt';
import PlanSelection from './PlanSelection';
import WorkspaceSelector from './WorkspaceSelector';
import PartnerConnection from './PartnerConnection';
import CalendarView from './CalendarView';
import TeamDashboard from './TeamDashboard';

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
  plan: string;
}

interface Workspace {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar' | 'teams' | 'partners'>('tasks');
  const { toast } = useToast();
  const { sendNotification } = useNotifications();

  useEffect(() => {
    console.log('Dashboard mounting, initializing...');
    getCurrentUser();
    fetchTasks();
    fetchProfile();
    
    // Set up push notification intervals (every 6 hours)
    const notificationInterval = setInterval(() => {
      checkAndSendReminders();
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds

    return () => clearInterval(notificationInterval);
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      setUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, cannot fetch profile');
        return;
      }

      console.log('Fetching profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      
      console.log('Profile data:', data);
      setProfile(data);
      
      // Check if user needs to select a plan
      if (!data.plan || data.plan === null || data.plan === 'free') {
        console.log('User needs to select a plan');
        setShowPlanSelection(true);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks...');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Tasks fetch error:', error);
        throw error;
      }
      
      console.log('Tasks data:', data);
      setTasks(data || []);
      
      // Update notification count
      const pendingTasks = data?.filter(task => !task.completed) || [];
      setNotificationCount(pendingTasks.length);
      
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAndSendReminders = () => {
    const pendingTasks = tasks.filter(task => !task.completed);
    if (pendingTasks.length > 0 && profile?.plan !== 'free') {
      sendNotification(
        'Task Reminder',
        `You have ${pendingTasks.length} pending tasks to complete`,
        { icon: '/icon-192.png' }
      );
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

  const handlePlanSelected = (plan: string) => {
    console.log('Plan selected:', plan);
    setShowPlanSelection(false);
    fetchProfile(); // Refresh to get updated plan
    toast({
      title: "Welcome!",
      description: "Your productivity journey starts now. Let's achieve your goals together!",
    });
  };

  // Add debugging render
  console.log('Dashboard render state:', { loading, showPlanSelection, profile, user });

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 dark:text-purple-300 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (showPlanSelection) {
    return (
      <PlanSelection 
        currentPlan={profile?.plan || 'free'} 
        onPlanSelected={handlePlanSelected} 
      />
    );
  }

  // Always render something visible - this is critical for preventing blank screens
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-purple-200 dark:border-purple-700 shadow-sm sticky top-0 z-40 transition-colors duration-300 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">PQ</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Pathway Quest
                  </h1>
                  {profile && (
                    <p className="text-sm text-purple-600 dark:text-purple-300">
                      Welcome back, {profile.name}! 👋
                      <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                        {profile.plan || 'free'}
                      </span>
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
                onClick={() => setShowNotifications(true)}
                variant="ghost"
                size="sm"
                className="text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50 relative"
              >
                <Bell className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Notifications</span>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Button>
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

      {/* Navigation Tabs */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setActiveTab('tasks')}
            variant={activeTab === 'tasks' ? 'default' : 'outline'}
            className={activeTab === 'tasks' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            size="sm"
          >
            Tasks & Progress
          </Button>
          {profile?.plan === 'premium' && (
            <>
              <Button
                onClick={() => setActiveTab('calendar')}
                variant={activeTab === 'calendar' ? 'default' : 'outline'}
                className={activeTab === 'calendar' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                size="sm"
              >
                Calendar
              </Button>
              <Button
                onClick={() => setActiveTab('teams')}
                variant={activeTab === 'teams' ? 'default' : 'outline'}
                className={activeTab === 'teams' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                size="sm"
              >
                Teams
              </Button>
              <Button
                onClick={() => setActiveTab('partners')}
                variant={activeTab === 'partners' ? 'default' : 'outline'}
                className={activeTab === 'partners' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                size="sm"
              >
                Partners
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-3 space-y-6 lg:space-y-8">
              {/* Workspace Selector */}
              {profile && (
                <WorkspaceSelector
                  currentWorkspace={currentWorkspace}
                  onWorkspaceChange={setCurrentWorkspace}
                  userPlan={profile.plan || 'free'}
                />
              )}

              {/* Streak Counter */}
              {profile && profile.plan !== 'free' && (
                <StreakCounter streak={profile.current_streak} />
              )}
              
              {/* Schedule Board */}
              <ScheduleBoard tasks={tasks} onTasksChange={handleTaskComplete} />
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              {/* Task Form */}
              <TaskForm onTaskAdded={fetchTasks} />
              
              {/* Progress Summary */}
              <ProgressSummary tasks={tasks} />
            </div>
          </div>
        )}

        {activeTab === 'calendar' && profile && (
          <CalendarView tasks={tasks} userPlan={profile.plan || 'free'} />
        )}

        {activeTab === 'teams' && profile && (
          <TeamDashboard userPlan={profile.plan || 'free'} />
        )}

        {activeTab === 'partners' && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            <PartnerConnection userPlan={profile.plan || 'free'} />
            {/* Add partner progress sharing component here in the future */}
          </div>
        )}
      </main>

      {/* Settings Panel */}
      {showSettings && (
        <EnhancedSettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {/* Notifications Panel */}
      <NotificationPanel 
        tasks={tasks} 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default Dashboard;
