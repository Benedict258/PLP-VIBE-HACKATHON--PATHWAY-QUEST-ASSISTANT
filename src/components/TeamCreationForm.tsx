
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface TeamCreationFormProps {
  onCreateTeam: (name: string, emoji: string, color: string) => void;
  loading: boolean;
  disabled: boolean;
}

const TeamCreationForm = ({ onCreateTeam, loading, disabled }: TeamCreationFormProps) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamEmoji, setNewTeamEmoji] = useState('👥');
  const [newTeamColor, setNewTeamColor] = useState('#8B5CF6');

  const handleSubmit = () => {
    if (!newTeamName.trim()) return;
    onCreateTeam(newTeamName.trim(), newTeamEmoji, newTeamColor);
    setNewTeamName('');
    setNewTeamEmoji('👥');
    setNewTeamColor('#8B5CF6');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-end">
      <div className="flex-1 min-w-0">
        <Input
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="Enter team name"
          className="w-full"
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>
      <div className="flex gap-2">
        <Input
          value={newTeamEmoji}
          onChange={(e) => setNewTeamEmoji(e.target.value)}
          placeholder="👥"
          className="w-16 text-center"
        />
        <Input
          type="color"
          value={newTeamColor}
          onChange={(e) => setNewTeamColor(e.target.value)}
          className="w-16 h-10 p-1 rounded cursor-pointer"
        />
        <Button
          onClick={handleSubmit}
          disabled={loading || !newTeamName.trim() || disabled}
          className="bg-purple-600 hover:bg-purple-700 px-4"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TeamCreationForm;
