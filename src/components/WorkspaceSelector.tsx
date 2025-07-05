
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, ChevronDown, Edit, Trash2, Archive } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface WorkspaceSelectorProps {
  currentWorkspace: Workspace | null;
  onWorkspaceChange: (workspace: Workspace) => void;
  userPlan: string;
}

const WorkspaceSelector = ({ currentWorkspace, onWorkspaceChange, userPlan }: WorkspaceSelectorProps) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceEmoji, setNewWorkspaceEmoji] = useState('📁');
  const [newWorkspaceColor, setNewWorkspaceColor] = useState('#8B5CF6');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const defaultWorkspaces = ['Personal', 'Work', 'Learning'];

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at');

      if (error) throw error;
      setWorkspaces(data || []);
      
      // Set first workspace as current if none selected
      if (data && data.length > 0 && !currentWorkspace) {
        onWorkspaceChange(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error loading workspaces",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    // Check if user has reached workspace limit
    const userWorkspaces = workspaces.length;
    const maxWorkspaces = userPlan === 'premium' ? 5 : 3;
    
    if (userWorkspaces >= maxWorkspaces) {
      toast({
        title: "Workspace limit reached",
        description: `${userPlan === 'premium' ? 'Premium' : 'Free'} plan allows up to ${maxWorkspaces} workspaces. Delete some to create new ones.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          user_id: user.id,
          name: newWorkspaceName.trim(),
          emoji: newWorkspaceEmoji,
          color: newWorkspaceColor
        })
        .select()
        .single();

      if (error) throw error;

      setWorkspaces(prev => [...prev, data]);
      onWorkspaceChange(data);
      setShowCreateForm(false);
      setNewWorkspaceName('');
      setNewWorkspaceEmoji('📁');
      setNewWorkspaceColor('#8B5CF6');
      
      toast({
        title: "Workspace created",
        description: `Created "${data.name}" workspace successfully!`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating workspace",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    // Prevent deletion of default workspaces
    if (defaultWorkspaces.includes(workspaceName)) {
      toast({
        title: "Cannot delete default workspace",
        description: "Default workspaces (Personal, Work, Learning) cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${workspaceName}"? This will also delete all tasks in this workspace.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;

      const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId);
      setWorkspaces(remainingWorkspaces);
      
      // Switch to first available workspace if current one was deleted
      if (currentWorkspace?.id === workspaceId && remainingWorkspaces.length > 0) {
        onWorkspaceChange(remainingWorkspaces[0]);
      }
      
      toast({
        title: "Workspace deleted",
        description: `Deleted "${workspaceName}" workspace.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting workspace",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (userPlan === 'free' && workspaces.length === 0) {
    return (
      <Card className="border-purple-200 bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏠</span>
              <div>
                <h3 className="font-semibold text-purple-800">Personal Workspace</h3>
                <p className="text-sm text-purple-600">Your main productivity space</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Upgrade for multiple workspaces
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Card 
        className="border-purple-200 bg-white/50 backdrop-blur-sm cursor-pointer hover:bg-white/70 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentWorkspace?.emoji || '📁'}</span>
              <div>
                <h3 className="font-semibold text-purple-800">{currentWorkspace?.name || 'Select Workspace'}</h3>
                <p className="text-sm text-purple-600">
                  {workspaces.length} of {userPlan === 'premium' ? '5' : '3'} workspaces
                </p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-purple-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="flex items-center group">
                <button
                  onClick={() => {
                    onWorkspaceChange(workspace);
                    setShowDropdown(false);
                  }}
                  className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors text-left"
                >
                  <span className="text-xl">{workspace.emoji}</span>
                  <span className="font-medium">{workspace.name}</span>
                  {currentWorkspace?.id === workspace.id && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">Current</span>
                  )}
                </button>
                {!defaultWorkspaces.includes(workspace.name) && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWorkspace(workspace.id, workspace.name);
                    }}
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 mr-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <div className="border-t border-gray-200 my-2"></div>
            
            {!showCreateForm ? (
              <Button
                onClick={() => setShowCreateForm(true)}
                disabled={loading || workspaces.length >= (userPlan === 'premium' ? 5 : 3)}
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Workspace
              </Button>
            ) : (
              <div className="p-2 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Workspace name"
                    className="flex-1"
                  />
                  <Input
                    value={newWorkspaceEmoji}
                    onChange={(e) => setNewWorkspaceEmoji(e.target.value)}
                    placeholder="📁"
                    className="w-16 text-center"
                  />
                </div>
                <Input
                  type="color"
                  value={newWorkspaceColor}
                  onChange={(e) => setNewWorkspaceColor(e.target.value)}
                  className="w-full h-10"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={createWorkspace}
                    disabled={loading || !newWorkspaceName.trim()}
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Create
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewWorkspaceName('');
                      setNewWorkspaceEmoji('📁');
                      setNewWorkspaceColor('#8B5CF6');
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelector;
