
import React, { useState } from 'react';
import { Task } from './ScheduleBoard';

interface WeeklyScheduleHoverProps {
  day: string;
  tasks: Task[];
  children: React.ReactNode;
}

const WeeklyScheduleHover = ({ day, tasks, children }: WeeklyScheduleHoverProps) => {
  const [showHover, setShowHover] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCategoryColor = (category: string) => {
    const colors = {
      'Programming': '#3B82F6',
      'Mechatronics & Tech': '#10B981',
      'Schoolwork': '#F59E0B',
      'Business Learning': '#EC4899',
    };
    return colors[category as keyof typeof colors] || '#8B5CF6';
  };

  const handleInteraction = () => {
    if (isMobile) {
      setShowHover(!showHover);
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => !isMobile && setShowHover(true)}
      onMouseLeave={() => !isMobile && setShowHover(false)}
      onClick={handleInteraction}
    >
      {children}
      
      {showHover && tasks.length > 0 && (
        <div className="hover-card">
          <h4 className="font-semibold text-sm mb-3 text-gray-900 dark:text-gray-100">
            {day} Tasks
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{
                  backgroundColor: `${getCategoryColor(task.category)}15`,
                  borderLeft: `3px solid ${getCategoryColor(task.category)}`
                }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(task.category) }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    task.completed 
                      ? 'line-through text-gray-500 dark:text-gray-500' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {task.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {task.category}
                  </p>
                </div>
                {task.completed && (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyScheduleHover;
