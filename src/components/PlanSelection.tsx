import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Crown, Check, Zap, Users, MessageCircle, Palette, Bell } from 'lucide-react';

interface PlanSelectionProps {
  currentPlan: string;
  onPlanSelected?: (newPlan: string) => void;
  showModal?: boolean;
  onClose?: () => void;
}

const PlanSelection = ({ currentPlan, onPlanSelected, showModal = false, onClose }: PlanSelectionProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const { toast } = useToast();

  const plans = [
    {
      id: 'free',
      name: 'Basic',
      price: 'Free',
      description: 'Perfect for personal productivity',
      features: [
        'Personal task tracking',
        'Basic categories',
        'Streak counter',
        'Calendar view',
        'Up to 3 workspaces'
      ],
      icon: Zap,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '$15/mo',
      description: 'Enhanced productivity features',
      features: [
        'Everything in Basic',
        'Push notifications',
        'Dark/Light themes',
        'Data export',
        'Priority support',
        'Up to 5 workspaces'
      ],
      icon: Bell,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$25/mo',
      description: 'Full collaboration suite',
      features: [
        'Everything in Standard',
        'Team dashboards',
        'Study partners',
        'Real-time chat',
        'Advanced analytics',
        'Unlimited workspaces',
        'Custom templates'
      ],
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      popular: true
    }
  ];

  const updatePlan = async (planId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ plan: planId })
        .eq('id', user.id);

      if (error) throw error;

      setSelectedPlan(planId);
      onPlanSelected?.(planId);
      
      toast({
        title: "Plan updated",
        description: `Successfully switched to ${plans.find(p => p.id === planId)?.name} plan!`,
      });

      if (onClose) {
        setTimeout(onClose, 1000);
      }
    } catch (error: any) {
      toast({
        title: "Error updating plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const PlanCard = ({ plan }: { plan: typeof plans[0] }) => {
    const IconComponent = plan.icon;
    const isCurrentPlan = selectedPlan === plan.id;
    
    return (
      <Card className={`relative ${plan.borderColor} ${isCurrentPlan ? plan.bgColor : 'bg-white'} transition-all hover:shadow-lg`}>
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
              Most Popular
            </span>
          </div>
        )}
        
        <CardHeader className="text-center pb-4">
          <div className={`w-12 h-12 mx-auto ${plan.bgColor} rounded-full flex items-center justify-center mb-3`}>
            <IconComponent className={`w-6 h-6 ${plan.color}`} />
          </div>
          <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
          <div className="text-2xl font-bold text-gray-900 mb-2">{plan.price}</div>
          <p className="text-sm text-gray-600">{plan.description}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          <Button
            onClick={() => updatePlan(plan.id)}
            disabled={loading || isCurrentPlan}
            className={`w-full ${
              isCurrentPlan
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : plan.id === 'premium'
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : plan.id === 'standard'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {isCurrentPlan ? 'Current Plan' : `Switch to ${plan.name}`}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                <p className="text-gray-600 mt-1">Select the plan that best fits your productivity needs</p>
              </div>
              {onClose && (
                <Button onClick={onClose} variant="ghost" size="sm">
                  ✕
                </Button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the plan that best fits your productivity needs. Start with Basic and upgrade anytime.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
      
      <div className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
        <p>
          💳 All plans include secure payment processing. Cancel anytime with no hidden fees.
          Need help choosing? <span className="text-purple-600 cursor-pointer">Contact support</span>.
        </p>
      </div>
    </div>
  );
};

export default PlanSelection;
