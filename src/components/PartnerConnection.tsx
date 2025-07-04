
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Check, X, Clock } from 'lucide-react';

interface Partner {
  id: string;
  partner_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
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
    if (userPlan !== 'free') {
      fetchPartners();
    }
  }, [userPlan]);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the status field to ensure it matches our interface
      const typedPartners: Partner[] = (data || []).map(partner => ({
        ...partner,
        status: partner.status as 'pending' | 'accepted' | 'declined'
      }));
      
      setPartners(typedPartners);
    } catch (error: any) {
      toast({
        title: "Error loading partners",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const invitePartner = async () => {
    if (!newPartnerEmail.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('partners')
        .insert({
          user_id: user.id,
          partner_email: newPartnerEmail.trim(),
          status: 'pending'
        });

      if (error) throw error;

      setNewPartnerEmail('');
      fetchPartners();
      toast({
        title: "Invitation sent!",
        description: `Sent partnership invitation to ${newPartnerEmail}`,
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

  const updatePartnerStatus = async (partnerId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ status })
        .eq('id', partnerId);

      if (error) throw error;

      fetchPartners();
      toast({
        title: status === 'accepted' ? "Partnership accepted!" : "Partnership declined",
        description: status === 'accepted' 
          ? "You're now connected with your accountability partner!"
          : "Partnership request declined.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating partnership",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (userPlan === 'free') {
    return (
      <Card className="border-purple-200 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Users className="w-5 h-5" />
            Accountability Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Connect with Progress Partners
            </h3>
            <p className="text-gray-500 mb-4">
              Find accountability partners to share your productivity journey
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-700 font-medium">🔒 Premium Feature</p>
              <p className="text-purple-600 text-sm">
                Upgrade to Premium to connect with accountability partners
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Users className="w-5 h-5" />
          Accountability Partners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            value={newPartnerEmail}
            onChange={(e) => setNewPartnerEmail(e.target.value)}
            placeholder="Enter partner's email address"
            type="email"
            className="flex-1"
          />
          <Button
            onClick={invitePartner}
            disabled={loading || !newPartnerEmail.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Mail className="w-4 h-4 mr-2" />
            Invite
          </Button>
        </div>

        <div className="space-y-3">
          {partners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No partnerships yet. Invite someone to be your accountability partner!</p>
            </div>
          ) : (
            partners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{partner.partner_email}</p>
                    <div className="flex items-center gap-2 text-sm">
                      {partner.status === 'pending' && (
                        <>
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span className="text-yellow-600">Pending</span>
                        </>
                      )}
                      {partner.status === 'accepted' && (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">Connected</span>
                        </>
                      )}
                      {partner.status === 'declined' && (
                        <>
                          <X className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">Declined</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {partner.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updatePartnerStatus(partner.id, 'accepted')}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => updatePartnerStatus(partner.id, 'declined')}
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerConnection;
