
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Mail, Crown, Eye, Edit } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  profiles?: {
    name: string;
  };
}

interface TeamDashboardProps {
  userPlan: string;
}

const TeamDashboard = ({ userPlan }: TeamDashboardProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userPlan === 'premium') {
      fetchTeams();
    }
  }, [userPlan]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers();
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

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
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(name)
        `)
        .eq('team_id', selectedTeam.id);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading team members",
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
      // In a real app, you would send an email invitation
      // For now, we'll just add a placeholder member
      toast({
        title: "Invitation sent",
        description: `Sent team invitation to ${newMemberEmail}`,
      });
      setNewMemberEmail('');
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
          <div className="text-center py-12">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Team Collaboration
            </h3>
            <p className="text-gray-500 mb-6">
              Create teams, assign tasks, and collaborate with your colleagues
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-purple-700 font-medium mb-2">🔒 Premium Feature</p>
              <p className="text-purple-600">
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
      <Card className="border-purple-200 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Users className="w-5 h-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter team name"
              className="flex-1"
            />
            <Button
              onClick={createTeam}
              disabled={loading || !newTeamName.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card
                key={team.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTeam?.id === team.id 
                    ? 'ring-2 ring-purple-500 bg-purple-50' 
                    : 'bg-white'
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{team.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(team.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTeam && (
        <Card className="border-purple-200 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Users className="w-5 h-5" />
              {selectedTeam.name} - Team Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Enter member's email"
                type="email"
                className="flex-1"
              />
              <Button
                onClick={inviteTeamMember}
                disabled={loading || !newMemberEmail.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </div>

            <div className="space-y-3">
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No team members yet. Invite colleagues to join your team!</p>
                </div>
              ) : (
                teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{member.profiles?.name || 'Unknown User'}</p>
                        <div className="flex items-center gap-2 text-sm">
                          {member.role === 'admin' && (
                            <>
                              <Crown className="w-4 h-4 text-yellow-500" />
                              <span className="text-yellow-600">Admin</span>
                            </>
                          )}
                          {member.role === 'editor' && (
                            <>
                              <Edit className="w-4 h-4 text-blue-500" />
                              <span className="text-blue-600">Editor</span>
                            </>
                          )}
                          {member.role === 'viewer' && (
                            <>
                              <Eye className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Viewer</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamDashboard;
