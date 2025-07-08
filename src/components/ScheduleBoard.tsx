
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import WeeklyScheduleHover from './WeeklyScheduleHover';

export interface Task {
  id: string;
  name: string;
  category: string;
  day: string;
  completed: boolean;
  created_at: string;
}

interface ScheduleBoardProps {
  tasks: Task[];
  onTasksChange: () => void;
}

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const ScheduleBoard = ({ tasks, onTasksChange }: ScheduleBoardProps) => {
  const { toast } = useToast();
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({});
  const [deletingTasks, setDeletingTasks] = useState<{ [key: string]: boolean }>({});

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', taskId);

      if (error) throw error;

      onTasksChange();
      toast({
        title: completed ? "Task marked incomplete" : "Task completed!",
        description: completed ? "Keep going!" : "Great job! 🎉",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string, taskName: string) => {
    if (!confirm(`Are you sure you want to delete "${taskName}"?`)) return;
    
    setDeletingTasks(prev => ({ ...prev, [taskId]: true }));
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      onTasksChange();
      toast({
        title: "Task deleted",
        description: `Removed "${taskName}"`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const getTasksForDay = (day: string) => {
    return tasks.filter(task => task.day === day);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Programming': '#3B82F6',
      'Mechatronics & Tech': '#10B981',
      'Schoolwork': '#F59E0B',
      'Business Learning': '#EC4899',
    };
    return colors[category as keyof typeof colors] || '#8B5CF6';
  };

  const getCategoryBgColor = (category: string) => {
    const colors = {
      'Programming': 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50',
      'Mechatronics & Tech': 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50',
      'Schoolwork': 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50',
      'Business Learning': 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700/50',
    };
    return colors[category as keyof typeof colors] || 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/50';
  };

  const toggleDayExpansion = (day: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
        task.completed 
          ? 'opacity-60' 
          : ''
      } ${getCategoryBgColor(task.category)} ${
        deletingTasks[task.id] ? 'animate-pulse' : ''
      }`}
      style={{
        borderLeft: `4px solid ${getCategoryColor(task.category)}`
      }}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => toggleTask(task.id, task.completed)}
        className="flex-shrink-0"
        disabled={deletingTasks[task.id]}
      />
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: getCategoryColor(task.category) }}
      />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm transition-all duration-200 ${
          task.completed 
            ? 'line-through text-gray-500 dark:text-gray-400' 
            : 'text-gray-800 dark:text-gray-200'
        }`}>
          {task.name}
        </p>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {task.category}
        </span>
      </div>
      {task.completed && (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => deleteTask(task.id, task.name)}
        disabled={deletingTasks[task.id]}
        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex-shrink-0 transition-colors duration-200"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  const DayCard = ({ day }: { day: string }) => {
    const dayTasks = getTasksForDay(day);
    const hasMultipleTasks = dayTasks.length > 1;
    const isExpanded = expandedDays[day];
    
    return (
      <WeeklyScheduleHover key={day} day={day} tasks={dayTasks}>
        <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 border border-violet-200 dark:border-violet-700/50 shadow-sm hover:shadow-md transition-all duration-200">
          <h3 className="font-semibold text-violet-800 dark:text-violet-300 mb-3 text-center">
            {day}
          </h3>
          
          {dayTasks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              No tasks scheduled
            </p>
          ) : hasMultipleTasks ? (
            <Collapsible open={isExpanded} onOpenChange={() => toggleDayExpansion(day)}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto text-sm hover:bg-violet-50 dark:hover:bg-violet-800/30 text-violet-700 dark:text-violet-300"
                  aria-expanded={isExpanded}
                >
                  <span className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {dayTasks.slice(0, 3).map((task, index) => (
                        <div
                          key={task.id}
                          className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
                          style={{ backgroundColor: getCategoryColor(task.category) }}
                          title={task.name}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-xs text-gray-600 dark:text-gray-300">+</span>
                        </div>
                      )}
                    </div>
                    <span>{dayTasks.length} Tasks</span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-violet-600 dark:text-violet-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-violet-600 dark:text-violet-400 transition-transform duration-200" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2 transition-[height] duration-300 ease-in-out">
                {dayTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <TaskItem task={dayTasks[0]} />
          )}
        </div>
      </WeeklyScheduleHover>
    );
  };

  return (
    <Card className="shadow-lg border-violet-200 dark:border-violet-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-violet-800 dark:text-violet-300 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Weekly Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {days.map((day) => (
            <DayCard key={day} day={day} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleBoard;
