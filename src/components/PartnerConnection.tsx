
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Users, Mail, Plus } from 'lucide-react';

interface Partner {
  id: string;
  partner_email: string;
  status: string;
  created_at: string;
  partner_name?: string;
}

interface PartnerConnectionProps {
  userPlan: string;
}

const PartnerConnection = ({ userPlan }: PartnerConnectionProps) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userPlan === 'premium') {
      fetchPartners();
    }
  }, [userPlan]);

  const fetchPartners = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          profiles!fk_partner_profile(name)
        `)
        .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPartners = data?.map(partner => ({
        ...partner,
        partner_name: partner.profiles?.name || partner.partner_email
      })) || [];

      setPartners(formattedPartners);
    } catch (error: any) {
      console.error('Error fetching partners:', error);
      toast({
        title: "Error loading partners",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const invitePartner = async () => {
    if (!newPartnerEmail.trim()) return;

    // Check if only 2 partners are allowed
    const activePartners = partners.filter(p => p.status === 'accepted');
    if (activePartners.length >= 2) {
      toast({
        title: "Partnership limit reached",
        description: "You can only have 2 active partnerships at a time.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user exists by email (case-insensitive)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('email', newPartnerEmail.trim());

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        toast({
          title: "User not found",
          description: "Please make sure the user has a Pathway Quest account with this email.",
          variant: "destructive",
        });
        return;
      }

      const partner = profiles[0];

      // Check if partnership already exists
      const { data: existingPartnership } = await supabase
        .from('partners')
        .select('id')
        .or(`and(user_id.eq.${user.id},partner_email.eq.${partner.email}),and(partner_id.eq.${user.id},partner_email.eq.${user.email})`)
        .single();

      if (existingPartnership) {
        toast({
          title: "Partnership already exists",
          description: "You already have a partnership with this user.",
          variant: "destructive",
        });
        return;
      }

      // Create partnership record
      const { error: partnerError } = await supabase
        .from('partners')
        .insert({
          user_id: user.id,
          partner_email: partner.email,
          status: 'pending'
        });

      if (partnerError) throw partnerError;

      // Create invite record
      const { error: inviteError } = await supabase
        .from('invites')
        .insert({
          type: 'partner',
          sender_id: user.id,
          receiver_email: partner.email
        });

      if (inviteError) throw inviteError;

      // Create notification for the invited user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: partner.id,
          type: 'partner_invite',
          title: 'Partnership Request',
          message: `You have a new partnership request from ${user.email}`,
          data: { partnerId: partner.id }
        });

      if (notificationError) console.error('Error creating notification:', notificationError);

      setNewPartnerEmail('');
      fetchPartners();
      
      toast({
        title: "Partnership invitation sent",
        description: `Invitation sent to ${newPartnerEmail}. They will receive a notification.`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'declined':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (userPlan !== 'premium') {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <MessageCircle className="w-5 h-5" />
            Partner Collaboration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 sm:py-12">
            <Users className="w-16 h-16 sm:w-20 sm:h-20 text-blue-300 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">
              Accountability Partners
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 px-4">
              Connect with accountability partners and collaborate on goals
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 max-w-md mx-auto">
              <p className="text-blue-700 font-medium mb-2">🔒 Premium Feature</p>
              <p className="text-sm sm:text-base text-blue-600">
                Upgrade to Premium to connect with accountability partners
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-white to-blue-50 shadow-lg">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <MessageCircle className="w-5 h-5" />
          Accountability Partners
        </CardTitle>
        <p className="text-sm text-blue-600">
          Connect with up to 2 accountability partners to stay motivated
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Invite Form */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={newPartnerEmail}
            onChange={(e) => setNewPartnerEmail(e.target.value)}
            placeholder="Partner's email address"
            className="flex-1 border-blue-200 focus:border-blue-400"
            type="email"
          />
          <Button
            onClick={invitePartner}
            disabled={loading || !newPartnerEmail.trim() || partners.filter(p => p.status === 'accepted').length >= 2}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Partner
          </Button>
        </div>

        {/* Partners List */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 text-sm">Your Partners</h3>
          
          {partners.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <p>No partners yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Invite someone to be your accountability partner!
              </p>
            </div>
          ) : (
            partners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {partner.partner_name}
                    </p>
                    <p className="text-sm text-gray-600">{partner.partner_email}</p>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(partner.status)}`}>
                  {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Partnership Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Partnership Benefits</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Real-time chat and collaboration</li>
            <li>• Shared task lists and progress tracking</li>
            <li>• Mutual accountability and motivation</li>
            <li>• Goal sharing and celebration</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerConnection;
