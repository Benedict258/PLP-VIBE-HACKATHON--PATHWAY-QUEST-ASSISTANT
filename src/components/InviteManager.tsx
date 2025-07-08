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
          teams(name)
        `)
        .eq('receiver_email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const invitesWithSenders = await Promise.all(
        (data || []).map(async (invite) => {
          const { data: profile } = await supabase
            .from('user_profiles') // ✅ custom view
            .select('email, user_id')
            .eq('user_id', invite.sender_id) // 👈 match by user_id, not id
            .single();
      
          return {
            id: invite.id,
            type: invite.type as 'team' | 'partner',
            sender_id: invite.sender_id,
            receiver_email: invite.receiver_email,
            team_id: invite.team_id || undefined,
            status: invite.status as 'pending' | 'accepted' | 'declined',
            created_at: invite.created_at || new Date().toISOString(),
            sender_name: profile?.email || 'Unknown User', // ✅ uses name from view
            team_name: invite.teams?.name || undefined
          };
        })
      );

      setInvites(invitesWithSenders);
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

      const { error: updateError } = await supabase
        .from('invites')
        .update({ status })
        .eq('id', inviteId);

      if (updateError) throw updateError;

      if (status === 'accepted') {
        if (type === 'team' && teamId) {
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
          const { data: chatRoom, error: chatError } = await supabase
            .from('chat_rooms')
            .insert({})
            .select()
            .single();

          if (chatError) throw chatError;

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

      fetchInvites();
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
    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-purple-900/20 border-purple-200 dark:border-purple-700 shadow-lg rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <Mail className="w-6 h-6" />
          Pending Invitations ({invites.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-xl border border-purple-100 dark:border-purple-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                {invite.type === 'team' ? (
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                ) : (
                  <MessageCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {invite.type === 'team' ? 'Team Invitation' : 'Partnership Request'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200"
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                onClick={() => handleInviteResponse(invite.id, 'declined', invite.type)}
                size="sm"
                variant="outline"
                className="border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200"
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
