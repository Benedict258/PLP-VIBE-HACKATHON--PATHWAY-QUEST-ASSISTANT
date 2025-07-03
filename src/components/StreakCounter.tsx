
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Flame } from 'lucide-react';

interface StreakCounterProps {
  streak: number;
  className?: string;
}

const StreakCounter = ({ streak, className = "" }: StreakCounterProps) => {
  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '🌟';
    return '💪';
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return 'Legendary streak!';
    if (streak >= 14) return 'On fire!';
    if (streak >= 7) return 'Great momentum!';
    if (streak >= 3) return 'Building habits!';
    if (streak >= 1) return 'Keep it up!';
    return 'Start your streak!';
  };

  return (
    <Card className={`bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-800 rounded-full p-2">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{getStreakMessage(streak)}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getStreakEmoji(streak)}</span>
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {streak}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {streak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakCounter;
