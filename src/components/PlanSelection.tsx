
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, Crown, Zap, Users, Calendar, Palette, Bell, Download } from 'lucide-react';

interface PlanSelectionProps {
  onPlanSelected: (plan: string) => void;
}

const PlanSelection = ({ onPlanSelected }: PlanSelectionProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 'Free',
      icon: Check,
      features: [
        'Personal task management',
        'Weekly progress tracking',
        'Basic categories',
        'Task completion streaks'
      ],
      color: 'border-gray-200 bg-white'
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '$15/month',
      icon: Crown,
      features: [
        'Everything in Free',
        'Dark/Light mode',
        'Push notifications',
        'Custom categories & themes',
        'Export data (CSV/PDF)',
        'Advanced streak tracking'
      ],
      color: 'border-purple-200 bg-purple-50',
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$25/month',
      icon: Zap,
      features: [
        'Everything in Standard',
        'Team dashboards',
        'Workspace switching',
        'Progress partner matching',
        'Calendar view with scheduling',
        'PWA installation',
        'AI productivity suggestions'
      ],
      color: 'border-gold-200 bg-gradient-to-br from-purple-50 to-indigo-50'
    }
  ];

  const handleSelectPlan = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({ plan: selectedPlan })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Welcome to Pathway Quest!",
        description: `You've selected the ${plans.find(p => p.id === selectedPlan)?.name} plan. Let's boost your productivity!`,
      });

      onPlanSelected(selectedPlan);
    } catch (error: any) {
      toast({
        title: "Error selecting plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">PQ</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Welcome to Pathway Quest
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your all-in-one productivity assistant for tasks, teams, and personal growth. 
            Choose the plan that fits your productivity journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-purple-500 shadow-lg' 
                    : 'hover:shadow-md'
                } ${plan.color}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </CardTitle>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {plan.price}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            onClick={handleSelectPlan}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? 'Setting up your account...' : `Start with ${plans.find(p => p.id === selectedPlan)?.name}`}
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            No payment required • Start your productivity journey today
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;
