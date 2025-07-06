
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

interface WorkspaceSetupProps {
  onSetupComplete: (workspaceName: string) => void;
}

const WorkspaceSetup = ({ onSetupComplete }: WorkspaceSetupProps) => {
  const [workspaceName, setWorkspaceName] = useState('');

  const handleSubmit = () => {
    if (workspaceName.trim()) {
      onSetupComplete(workspaceName.trim());
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to Pathway Quest
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Let's set up your workspace
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What would you like to name your workspace?
            </label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="My Productivity Space"
              className="w-full"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!workspaceName.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Create Workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceSetup;
