
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
}

const NotificationBadge = ({ count, onClick }: NotificationBadgeProps) => {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className="text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50 relative"
    >
      <Bell className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">Notifications</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
};

export default NotificationBadge;
