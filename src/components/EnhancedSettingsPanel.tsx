import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Settings, User, Palette, Bell, Plus, Trash2, Download, Crown, CreditCard } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Profile {
  id: string;
  name: string;
  current_streak: number;
  theme_preference: string;
  notifications_enabled: boolean;
  plan: string;
}

interface EnhancedSettingsPanelProps {
  onClose: () => void;
}

const EnhancedSettingsPanel = ({ onClose }: EnhancedSettingsPanelProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#8B5CF6');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { notificationsEnabled, toggleNotifications } = useNotifications();

  useEffect(() => {
    fetchProfile();
    fetchCategories();
  }, []);

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
      setName(data.name);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading categories",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProfile = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      setProfile({ ...profile, name });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword('');
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: newCategoryName.trim(),
          color: newCategoryColor
        });

      if (error) throw error;

      setNewCategoryName('');
      setNewCategoryColor('#8B5CF6');
      fetchCategories();
      
      toast({
        title: "Category added",
        description: `Added "${newCategoryName}" category.`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding category",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      fetchCategories();
      toast({
        title: "Category deleted",
        description: `Removed "${categoryName}" category.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (newPlan: string) => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: newPlan })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Plan upgraded!",
        description: `Successfully upgraded to ${newPlan}. Enjoy your new features!`,
      });
      
      setProfile({ ...profile, plan: newPlan });
    } catch (error: any) {
      toast({
        title: "Error upgrading plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'pdf') => {
    if (profile?.plan === 'free') {
      toast({
        title: "Premium Feature",
        description: "Data export is available with Standard and Premium plans. Upgrade to unlock this feature!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (format === 'csv') {
        const csvContent = [
          ['Task Name', 'Category', 'Day', 'Completed', 'Created At'],
          ...(data || []).map(task => [
            task.name,
            task.category,
            task.day,
            task.completed ? 'Yes' : 'No',
            new Date(task.created_at).toLocaleDateString()
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pathway-quest-tasks.csv';
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Data exported",
        description: `Your tasks have been exported as ${format.toUpperCase()}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error exporting data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card className="border-purple-200 dark:border-purple-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <User className="w-5 h-5" />
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={updateProfile}
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Update Profile
                    </Button>
                    <Button
                      onClick={updatePassword}
                      disabled={loading || !newPassword.trim()}
                      variant="outline"
                    >
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card className="border-purple-200 dark:border-purple-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Palette className="w-5 h-5" />
                    Appearance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={toggleTheme}
                    />
                  </div>
                  
                  {profile.plan !== 'free' && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <Label>Custom Themes</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Personalize your dashboard with custom color schemes
                        </p>
                        <div className="grid grid-cols-4 gap-3">
                          {['purple', 'blue', 'green', 'orange'].map((color) => (
                            <div
                              key={color}
                              className={`w-12 h-12 rounded-lg cursor-pointer border-2 border-transparent hover:border-gray-300 bg-${color}-500`}
                              onClick={() => {/* theme switching logic */}}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {profile.plan === 'free' && (
                    <div className="border-t pt-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-purple-700 font-medium mb-2">🎨 Custom Themes</p>
                        <p className="text-purple-600 text-sm">
                          Upgrade to Standard or Premium to unlock custom theme options
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card className="border-purple-200 dark:border-purple-700">
                <CardHeader>
                  <CardTitle className="text-purple-700 dark:text-purple-300">
                    Category Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1"
                    />
                    <Input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-16"
                    />
                    <Button
                      onClick={addCategory}
                      disabled={loading || !newCategoryName.trim()}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium dark:text-white">{category.name}</span>
                        </div>
                        <Button
                          onClick={() => deleteCategory(category.id, category.name)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card className="border-purple-200 dark:border-purple-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Bell className="w-5 h-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {profile.plan === 'free' 
                          ? 'Available with Standard and Premium plans'
                          : 'Get reminders for pending tasks and streak milestones'
                        }
                      </p>
                    </div>
                    <Switch
                      checked={notificationsEnabled && profile.plan !== 'free'}
                      onCheckedChange={profile.plan !== 'free' ? toggleNotifications : undefined}
                      disabled={profile.plan === 'free'}
                    />
                  </div>
                  
                  {profile.plan === 'free' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-purple-700 font-medium mb-2">🔔 Push Notifications</p>
                      <p className="text-purple-600 text-sm">
                        Upgrade to Standard or Premium to receive task reminders and motivational alerts
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <Card className="border-purple-200 dark:border-purple-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <CreditCard className="w-5 h-5" />
                    Plan & Billing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-purple-800">Current Plan</h4>
                      <p className="text-purple-600 capitalize flex items-center gap-2">
                        {profile.plan === 'premium' && <Crown className="w-4 h-4" />}
                        {profile.plan} Plan
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-700">
                        {profile.plan === 'free' ? 'Free' : 
                         profile.plan === 'standard' ? '$15/mo' : '$25/mo'}
                      </p>
                    </div>
                  </div>

                  {profile.plan !== 'premium' && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Upgrade Your Plan</h4>
                      
                      {profile.plan === 'free' && (
                        <div className="grid gap-4">
                          <Card className="border-purple-200">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h5 className="font-semibold">Standard Plan</h5>
                                  <p className="text-sm text-gray-600">Dark mode, notifications, custom themes</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">$15/mo</p>
                                  <Button
                                    onClick={() => upgradePlan('standard')}
                                    disabled={loading}
                                    size="sm"
                                    className="mt-2"
                                  >
                                    Upgrade
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-purple-200">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h5 className="font-semibold flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                    Premium Plan
                                  </h5>
                                  <p className="text-sm text-gray-600">Teams, workspaces, calendar, AI features</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">$25/mo</p>
                                  <Button
                                    onClick={() => upgradePlan('premium')}
                                    disabled={loading}
                                    size="sm"
                                    className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600"
                                  >
                                    Upgrade
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {profile.plan === 'standard' && (
                        <Card className="border-purple-200">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h5 className="font-semibold flex items-center gap-2">
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                  Premium Plan
                                </h5>
                                <p className="text-sm text-gray-600">Unlock teams, workspaces, and advanced features</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">$25/mo</p>
                                <Button
                                  onClick={() => upgradePlan('premium')}
                                  disabled={loading}
                                  size="sm"
                                  className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600"
                                >
                                  Upgrade
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Export Your Data</h4>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => exportData('csv')}
                        disabled={loading}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </Button>
                      <Button
                        onClick={() => exportData('pdf')}
                        disabled={loading}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export PDF
                      </Button>
                    </div>
                    {profile.plan === 'free' && (
                      <p className="text-sm text-gray-500 mt-2">
                        Data export is available with Standard and Premium plans
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSettingsPanel;
