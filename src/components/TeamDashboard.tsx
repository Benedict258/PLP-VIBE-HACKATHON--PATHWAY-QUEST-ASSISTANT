
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Mail, Crown, Eye, Edit, MessageCircle, CheckSquare } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface TeamTask {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  assigned_to: string | null;
  day: string;
  team_id: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  profiles?: {
    name: string;
    first_name: string;
  } | null;
}

interface TeamDashboardProps {
  userPlan: string;
}

const TeamDashboard = ({ userPlan }: TeamDashboardProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamTasks, setTeamTasks] = useState<TeamTask[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<'tasks' | 'members' | 'chat'>('tasks');
  const { toast } = useToast();

  useEffect(() => {
    if (userPlan === 'premium') {
      fetchTeams();
    }
  }, [userPlan]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers();
      fetchTeamTasks();
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3); // Max 3 teams per user

      if (error) throw error;
      setTeams(data || []);
      
      if (data && data.length > 0 && !selectedTeam) {
        setSelectedTeam(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error loading teams",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchTeamMembers = async () => {
    if (!selectedTeam) return;

    try {
      // Try to fetch with profiles relation first
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!team_members_user_id_fkey (name, first_name)
        `)
        .eq('team_id', selectedTeam.id);

      if (error) {
        console.log('Error fetching team members with profiles:', error);
        // Fallback to basic team member data
        const { data: basicData, error: basicError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', selectedTeam.id);
        
        if (basicError) throw basicError;
        
        // Transform data to match TeamMember interface
        const transformedData: TeamMember[] = (basicData || []).map(member => ({
          ...member,
          role: member.role as 'admin' | 'editor' | 'viewer',
          profiles: null
        }));
        
        setTeamMembers(transformedData);
      } else {
        // Transform data to match TeamMember interface
        const transformedData: TeamMember[] = (data || []).map(member => ({
          ...member,
          role: member.role as 'admin' | 'editor' | 'viewer',
          profiles: member.profiles || null
        }));
        
        setTeamMembers(transformedData);
      }
    } catch (error: any) {
      toast({
        title: "Error loading team members",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchTeamTasks = async () => {
    if (!selectedTeam) return;

    try {
      const { data, error } = await supabase
        .from('team_tasks')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamTasks(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading team tasks",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin
      await supabase
        .from('team_members')
        .insert({
          team_id: data.id,
          user_id: user.id,
          role: 'admin'
        });

      setNewTeamName('');
      fetchTeams();
      setSelectedTeam(data);
      
      toast({
        title: "Team created",
        description: `Created "${data.name}" team successfully!`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteTeamMember = async () => {
    if (!newMemberEmail.trim() || !selectedTeam) return;

    setLoading(true);
    try {
      // Check if user exists by email/name in profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name')
        .or(`name.ilike.%${newMemberEmail}%`);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        toast({
          title: "User not found",
          description: "Please make sure the user has a Pathway Quest account.",
          variant: "destructive",
        });
        return;
      }

      // Add to team
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: selectedTeam.id,
          user_id: profiles[0].id,
          role: 'editor'
        });

      if (error) throw error;

      setNewMemberEmail('');
      fetchTeamMembers();
      
      toast({
        title: "Member invited",
        description: `Added ${newMemberEmail} to the team!`,
      });
    } catch (error: any) {
      toast({
        title: "Error inviting member",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTeamTask = async () => {
    if (!newTaskName.trim() || !selectedTeam) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_tasks')
        .insert({
          team_id: selectedTeam.id,
          name: newTaskName.trim(),
          category: 'Team Task',
          day: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      setNewTaskName('');
      fetchTeamTasks();
      
      toast({
        title: "Task created",
        description: `Added "${newTaskName}" to team tasks!`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('team_tasks')
        .update({ completed: !completed })
        .eq('id', taskId);

      if (error) throw error;
      fetchTeamTasks();
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getMemberDisplayName = (member: TeamMember) => {
    return member.profiles?.name || 'Unknown User';
  };

  if (userPlan !== 'premium') {
    return (
      <Card className="border-purple-200 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Users className="w-5 h-5" />
            Team Dashboards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 sm:py-12">
            <Users className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">
              Team Collaboration
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 px-4">
              Create teams, assign tasks, and collaborate with your colleagues
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 sm:p-6 max-w-md mx-auto">
              <p className="text-purple-700 font-medium mb-2">🔒 Premium Feature</p>
              <p className="text-sm sm:text-base text-purple-600">
                Upgrade to Premium to access team dashboards and collaboration tools
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Team Creation */}
      <Card className="border-purple-200 bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-purple-700 text-lg sm:text-xl">
            <Users className="w-5 h-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter team name"
              className="flex-1"
            />
            <Button
              onClick={createTeam}
              disabled={loading || !newTeamName.trim() || teams.length >= 3}
              className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>
          {teams.length >= 3 && (
            <p className="text-sm text-amber-600">Maximum 3 teams allowed</p>
          )}
        </CardContent>
      </Card>

      {/* Team Switcher - Horizontal Bar */}
      {teams.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {teams.map((team) => (
            <Button
              key={team.id}
              variant={selectedTeam?.id === team.id ? "default" : "outline"}
              onClick={() => setSelectedTeam(team)}
              className={`whitespace-nowrap flex-shrink-0 ${
                selectedTeam?.id === team.id 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'hover:bg-purple-50'
              }`}
            >
              {team.name}
            </Button>
          ))}
        </div>
      )}

      {/* Selected Team Dashboard */}
      {selectedTeam && (
        <Card className="border-purple-200 bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Users className="w-5 h-5" />
              {selectedTeam.name}
            </CardTitle>
            {/* Panel Switcher */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={activePanel === 'tasks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePanel('tasks')}
                className="flex-1"
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                Tasks
              </Button>
              <Button
                variant={activePanel === 'members' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePanel('members')}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-1" />
                Members
              </Button>
              <Button
                variant={activePanel === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePanel('chat')}
                className="flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Chat
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {activePanel === 'tasks' && (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Add team task"
                    className="flex-1"
                  />
                  <Button
                    onClick={createTeamTask}
                    disabled={loading || !newTaskName.trim()}
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teamTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No team tasks yet. Create your first task!</p>
                    </div>
                  ) : (
                    teamTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskComplete(task.id, task.completed)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activePanel === 'members' && (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Member name or email"
                    className="flex-1"
                  />
                  <Button
                    onClick={inviteTeamMember}
                    disabled={loading || !newMemberEmail.trim()}
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-purple-600">
                          {getInitials(getMemberDisplayName(member))}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{getMemberDisplayName(member)}</p>
                          <div className="flex items-center gap-1 text-xs">
                            {member.role === 'admin' && (
                              <>
                                <Crown className="w-3 h-3 text-yellow-500" />
                                <span className="text-yellow-600">Admin</span>
                              </>
                            )}
                            {member.role === 'editor' && (
                              <>
                                <Edit className="w-3 h-3 text-blue-500" />
                                <span className="text-blue-600">Editor</span>
                              </>
                            )}
                            {member.role === 'viewer' && (
                              <>
                                <Eye className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-600">Viewer</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activePanel === 'chat' && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Team chat coming soon!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamDashboard;
