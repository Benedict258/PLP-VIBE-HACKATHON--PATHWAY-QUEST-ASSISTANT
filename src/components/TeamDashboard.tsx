import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Crown, Eye, Edit, MessageCircle, CheckSquare, Trash2, Plus } from 'lucide-react';
import TeamCreationForm from './TeamCreationForm';

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
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<'tasks' | 'members' | 'chat'>('tasks');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (userPlan === 'premium') {
      getCurrentUser();
      fetchTeams();
    }
  }, [userPlan]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers();
      fetchTeamTasks();
    }
  }, [selectedTeam]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

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
          profiles!fk_team_member_profile (name, first_name)
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

  const inviteTeamMember = async () => {
    if (!newMemberEmail.trim() || !selectedTeam) return;

    setLoading(true);
    try {
      // Check if user exists by email (case-insensitive)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('email', newMemberEmail.trim());

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        toast({
          title: "User not found",
          description: "Please make sure the user has a Pathway Quest account with this email.",
          variant: "destructive",
        });
        return;
      }

      const user = profiles[0];

      // Check if user is already a team member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', selectedTeam.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast({
          title: "User already in team",
          description: "This user is already a member of this team.",
          variant: "destructive",
        });
        return;
      }

      // Create invite
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { error: inviteError } = await supabase
        .from('invites')
        .insert({
          type: 'team',
          sender_id: currentUser.id,
          receiver_email: user.email,
          team_id: selectedTeam.id
        });

      if (inviteError) throw inviteError;

      // Create notification for the invited user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'team_invite',
          title: 'Team Invitation',
          message: `You've been invited to join "${selectedTeam.name}"`,
          data: { teamId: selectedTeam.id, teamName: selectedTeam.name }
        });

      if (notificationError) console.error('Error creating notification:', notificationError);

      setNewMemberEmail('');
      
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${newMemberEmail}. They will receive a notification.`,
      });
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
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
          day: new Date().toISOString().split('T')[0] // Proper date format
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

  const createTeam = async (name: string, emoji: string, color: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: name,
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

  const deleteTeam = async (teamId: string, teamName: string) => {
    const isOwner = currentUser && selectedTeam && selectedTeam.owner_id === currentUser.id;
    
    if (!isOwner) {
      toast({
        title: "Permission denied",
        description: "Only the team owner can delete this team.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${teamName}"? This will permanently remove the team and all its data for all members.`)) {
      return;
    }

    setLoading(true);
    try {
      // Delete team tasks first
      await supabase
        .from('team_tasks')
        .delete()
        .eq('team_id', teamId);

      // Delete team members
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);

      // Delete team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      const remainingTeams = teams.filter(t => t.id !== teamId);
      setTeams(remainingTeams);
      
      // Switch to first available team if current one was deleted
      if (selectedTeam?.id === teamId && remainingTeams.length > 0) {
        setSelectedTeam(remainingTeams[0]);
      } else if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
      }
      
      toast({
        title: "Team deleted",
        description: `Deleted "${teamName}" team and all associated data.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (userPlan !== 'premium') {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Users className="w-5 h-5" />
            Team Dashboards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 sm:py-12">
            <Users className="w-16 h-16 sm:w-20 sm:h-20 text-blue-300 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">
              Team Collaboration
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 px-4">
              Create teams, assign tasks, and collaborate with your colleagues
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 max-w-md mx-auto">
              <p className="text-blue-700 font-medium mb-2">🔒 Premium Feature</p>
              <p className="text-sm sm:text-base text-blue-600">
                Upgrade to Premium to access team dashboards and collaboration tools
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Creation */}
      <Card className="border-purple-200 dark:border-purple-700 bg-gradient-to-r from-white to-purple-50 dark:from-slate-800 dark:to-purple-900/20 shadow-lg rounded-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-xl">
            <Users className="w-6 h-6" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TeamCreationForm
            onCreateTeam={createTeam}
            loading={loading}
            disabled={teams.length >= 3}
          />
          {teams.length >= 3 && (
            <p className="text-sm text-amber-600">Maximum 3 teams allowed</p>
          )}
        </CardContent>
      </Card>

      {/* Team Switcher - Horizontal Bar */}
      {teams.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {teams.map((team) => (
            <div key={team.id} className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant={selectedTeam?.id === team.id ? "default" : "outline"}
                onClick={() => setSelectedTeam(team)}
                className={`whitespace-nowrap ${
                  selectedTeam?.id === team.id 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white rounded-xl' 
                    : 'hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300 rounded-xl'
                } transition-all duration-200`}
              >
                {team.name}
              </Button>
              {currentUser && team.owner_id === currentUser.id && (
                <Button
                  onClick={() => deleteTeam(team.id, team.name)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-xl transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected Team Dashboard */}
      {selectedTeam && (
        <Card className="border-purple-200 dark:border-purple-700 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-900/20 shadow-lg rounded-2xl">
          <CardHeader className="pb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Users className="w-6 h-6" />
              {selectedTeam.name}
            </CardTitle>
            {/* Panel Switcher */}
            <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-purple-200 dark:border-purple-700">
              <Button
                variant={activePanel === 'tasks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePanel('tasks')}
                className={`flex-1 rounded-lg transition-all duration-200 ${activePanel === 'tasks' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'}`}
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                Tasks
              </Button>
              <Button
                variant={activePanel === 'members' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePanel('members')}
                className={`flex-1 rounded-lg transition-all duration-200 ${activePanel === 'members' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'}`}
              >
                <Users className="w-4 h-4 mr-1" />
                Members
              </Button>
              <Button
                variant={activePanel === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePanel('chat')}
                className={`flex-1 rounded-lg transition-all duration-200 ${activePanel === 'chat' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'}`}
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
                    className="flex-1 border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:bg-slate-700 dark:text-white rounded-xl transition-all duration-200"
                  />
                  <Button
                    onClick={createTeamTask}
                    disabled={loading || !newTaskName.trim()}
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto rounded-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teamTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckSquare className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                      <p>No team tasks yet. Create your first task!</p>
                    </div>
                  ) : (
                    teamTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700 rounded-xl border border-purple-100 dark:border-purple-700 hover:shadow-md transition-all duration-200"
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskComplete(task.id, task.completed)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
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
                    placeholder="Member email address"
                    className="flex-1 border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:bg-slate-700 dark:text-white rounded-xl transition-all duration-200"
                  />
                  <Button
                    onClick={inviteTeamMember}
                    disabled={loading || !newMemberEmail.trim()}
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto rounded-xl transition-all duration-200"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-xl border border-purple-100 dark:border-purple-700 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-sm font-medium text-purple-600 dark:text-purple-300">
                          {getInitials(getMemberDisplayName(member))}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{getMemberDisplayName(member)}</p>
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
                <MessageCircle className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                <p>Team chat coming soon!</p>
                <p className="text-sm text-gray-400 mt-2">
                  Real-time team collaboration features in development
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamDashboard;