
import React, { useState } from 'react';
import { Task } from './ScheduleBoard';

interface WeeklyScheduleHoverProps {
  day: string;
  tasks: Task[];
  children: React.ReactNode;
  disabled?: boolean;
}

const WeeklyScheduleHover = ({ day, tasks, children, disabled = false }: WeeklyScheduleHoverProps) => {
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
    if (isMobile && !disabled) {
      setShowHover(!showHover);
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => !isMobile && !disabled && setShowHover(true)}
      onMouseLeave={() => !isMobile && !disabled && setShowHover(false)}
      onClick={handleInteraction}
    >
      {children}
      
      {showHover && tasks.length > 0 && (
        <div className="hover-card">
          <h4 className="font-semibold text-base mb-3 text-slate-900 dark:text-slate-100 leading-relaxed">
            {day} Tasks
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                style={{
                  backgroundColor: `${getCategoryColor(task.category)}15`,
                  borderLeft: `3px solid ${getCategoryColor(task.category)}`
                }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: getCategoryColor(task.category) }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-medium leading-relaxed ${
                    task.completed 
                      ? 'line-through text-slate-500 dark:text-slate-500' 
                      : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {task.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-violet-300 font-medium">
                    {task.category}
                  </p>
                </div>
                {task.completed && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-md">
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
