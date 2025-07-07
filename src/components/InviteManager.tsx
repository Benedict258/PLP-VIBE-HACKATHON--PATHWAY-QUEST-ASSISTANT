
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Check, X, Users, MessageCircle } from 'lucide-react';

interface Invite {
  id: string;
  type: 'team' | 'partner';
  sender_id: string;
  receiver_email: string;
  team_id?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender_name?: string;
  team_name?: string;
}

const InviteManager = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('invites')
        .select(`
          *,
          profiles!invites_sender_id_fkey(name),
          teams(name)
        `)
        .eq('receiver_email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedInvites = data?.map(invite => ({
        ...invite,
        sender_name: invite.profiles?.name || 'Unknown User',
        team_name: invite.teams?.name
      })) || [];

      setInvites(formattedInvites);
    } catch (error: any) {
      console.error('Error fetching invites:', error);
      toast({
        title: "Error loading invites",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteResponse = async (inviteId: string, status: 'accepted' | 'declined', type: string, teamId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update invite status
      const { error: updateError } = await supabase
        .from('invites')
        .update({ status })
        .eq('id', inviteId);

      if (updateError) throw updateError;

      if (status === 'accepted') {
        if (type === 'team' && teamId) {
          // Add user to team
          const { error: memberError } = await supabase
            .from('team_members')
            .insert({
              team_id: teamId,
              user_id: user.id,
              role: 'editor'
            });

          if (memberError) throw memberError;

          toast({
            title: "Team invite accepted!",
            description: "You've joined the team successfully.",
          });
        } else if (type === 'partner') {
          // Create chat room for partnership
          const { data: chatRoom, error: chatError } = await supabase
            .from('chat_rooms')
            .insert({})
            .select()
            .single();

          if (chatError) throw chatError;

          // Update partnership with chat room
          const { error: partnerError } = await supabase
            .from('partners')
            .update({ 
              status: 'accepted',
              chat_room_id: chatRoom.id,
              partner_id: user.id
            })
            .eq('partner_email', user.email);

          if (partnerError) throw partnerError;

          toast({
            title: "Partnership accepted!",
            description: "You can now chat and collaborate!",
          });
        }
      } else {
        toast({
          title: "Invite declined",
          description: "The invitation has been declined.",
        });
      }

      fetchInvites(); // Refresh invites
    } catch (error: any) {
      toast({
        title: "Error responding to invite",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Mail className="w-5 h-5" />
          Pending Invitations ({invites.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                {invite.type === 'team' ? (
                  <Users className="w-4 h-4 text-blue-600" />
                ) : (
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {invite.type === 'team' ? 'Team Invitation' : 'Partnership Request'}
                </p>
                <p className="text-sm text-gray-600">
                  From {invite.sender_name}
                  {invite.type === 'team' && invite.team_name && (
                    <span> to join "{invite.team_name}"</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleInviteResponse(invite.id, 'accepted', invite.type, invite.team_id)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                onClick={() => handleInviteResponse(invite.id, 'declined', invite.type)}
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default InviteManager;
