
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Zap } from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm = ({ onAuthSuccess }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to your account.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || 'User'
            },
            emailRedirectTo: undefined // Disable email verification
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Welcome to Pathway Quest! Let's boost your productivity.",
        });
      }
      
      onAuthSuccess();
    } catch (error: any) {
      toast({
        title: isLogin ? "Sign in failed" : "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">PQ</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Pathway Quest
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your productivity assistant for success
          </p>
        </div>

        {/* Features Preview */}
        <div className="mb-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-purple-200 dark:border-purple-700">
            <Zap className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-300">Smart Tasks</p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-purple-200 dark:border-purple-700">
            <User className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-300">Team Sync</p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-purple-200 dark:border-purple-700">
            <Mail className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-300">Partners</p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="shadow-2xl border-purple-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300">
              {isLogin 
                ? 'Sign in to continue your productivity journey' 
                : 'Join thousands of productive users'
              }
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                {loading 
                  ? (isLogin ? 'Signing in...' : 'Creating account...') 
                  : (isLogin ? 'Sign In' : 'Create Account')
                }
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
            
            {!isLogin && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 text-center">
                  ✨ No email verification required - start immediately!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>🚀 Free plan available • No credit card required</p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
