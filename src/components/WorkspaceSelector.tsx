
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, ChevronDown } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  const createWorkspace = async (name: string, emoji: string, color: string) => {
    if (userPlan === 'free') {
      toast({
        title: "Premium Feature",
        description: "Multiple workspaces are available with Premium. Upgrade to create custom workspaces!",
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
          name,
          emoji,
          color
        })
        .select()
        .single();

      if (error) throw error;

      setWorkspaces(prev => [...prev, data]);
      onWorkspaceChange(data);
      toast({
        title: "Workspace created",
        description: `Created "${name}" workspace successfully!`,
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

  if (userPlan === 'free') {
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
                <p className="text-sm text-purple-600">Switch between your productivity spaces</p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-purple-200 z-50">
          <div className="p-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  onWorkspaceChange(workspace);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors text-left"
              >
                <span className="text-xl">{workspace.emoji}</span>
                <span className="font-medium">{workspace.name}</span>
              </button>
            ))}
            <div className="border-t border-gray-200 my-2"></div>
            <Button
              onClick={() => createWorkspace('New Workspace', '✨', '#8B5CF6')}
              disabled={loading}
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Workspace
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelector;
