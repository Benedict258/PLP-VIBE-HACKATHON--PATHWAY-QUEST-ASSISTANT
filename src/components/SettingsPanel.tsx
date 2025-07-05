
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Settings, User, Palette, Bell, Plus, Trash2, Crown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Profile {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  current_streak: number;
  theme_preference: string;
  notifications_enabled: boolean;
  plan: string;
}

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel = ({ onClose }: SettingsPanelProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#8B5CF6');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('profile');
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
      setName(data.name || '');
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
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
        .update({ 
          name: name || `${firstName} ${lastName}`.trim(),
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      setProfile({ 
        ...profile, 
        name: name || `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName
      });
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
    if (categories.length >= 8) {
      toast({
        title: "Category limit reached",
        description: "Maximum 8 categories allowed.",
        variant: "destructive",
      });
      return;
    }

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
    const defaultCategories = ['Programming', 'Learning & Development', 'Work Tasks', 'Personal Goals'];
    if (defaultCategories.includes(categoryName)) {
      toast({
        title: "Cannot delete default category",
        description: "Default categories cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'categories', label: 'Categories', icon: Settings },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'plan', label: 'Plan', icon: Crown }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              {profile.first_name ? getInitials(`${profile.first_name} ${profile.last_name}`) : getInitials(profile.name)}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile.name} • {profile.plan} plan
              </p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
            ✕
          </Button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-48 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            <nav className="p-4 space-y-2">
              {sections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6">
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your display name"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last name"
                            className="mt-1"
                          />
                        </div>
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
                      <div className="flex flex-col sm:flex-row gap-2">
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
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'categories' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Categories</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-2">
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
                          disabled={loading || !newCategoryName.trim() || categories.length >= 8}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
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
                      
                      <p className="text-sm text-gray-500">
                        {categories.length} of 8 categories used
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">App Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Dark Mode</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
                        </div>
                        <Switch
                          checked={theme === 'dark'}
                          onCheckedChange={toggleTheme}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <Label className="flex items-center gap-2 text-sm font-medium">
                            <Bell className="w-4 h-4" />
                            Push Notifications
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Get reminders for pending tasks</p>
                        </div>
                        <Switch
                          checked={notificationsEnabled}
                          onCheckedChange={toggleNotifications}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'plan' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Plan</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-center gap-3 mb-2">
                          <Crown className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold text-purple-700 dark:text-purple-300 capitalize">
                            {profile.plan} Plan
                          </span>
                        </div>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          {profile.plan === 'free' && 'Personal task tracking and basic features'}
                          {profile.plan === 'standard' && 'Enhanced features with notifications and themes'}
                          {profile.plan === 'premium' && 'Full access to teams, workspaces, and collaboration'}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <Button
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => {
                            toast({
                              title: "Coming soon",
                              description: "Plan management will be available soon!",
                            });
                          }}
                        >
                          Manage Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
