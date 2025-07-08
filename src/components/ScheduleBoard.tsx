
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Calendar, ChevronDown, ChevronRight, Check } from 'lucide-react';
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
  const [completingTasks, setCompletingTasks] = useState<{ [key: string]: boolean }>({});

  const toggleTask = async (taskId: string, completed: boolean) => {
    setCompletingTasks(prev => ({ ...prev, [taskId]: true }));
    
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
    } finally {
      setCompletingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const deleteTask = async (taskId: string, taskName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${taskName}"?`);
    if (!confirmed) return;
    
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

  const getCategoryBgColor = (category: string, completed: boolean = false) => {
    const baseOpacity = completed ? '5' : '10';
    const colors = {
      'Programming': `bg-blue-${baseOpacity}0 dark:bg-blue-500/10 border-blue-200/30 dark:border-blue-400/20`,
      'Mechatronics & Tech': `bg-green-${baseOpacity}0 dark:bg-green-500/10 border-green-200/30 dark:border-green-400/20`,
      'Schoolwork': `bg-orange-${baseOpacity}0 dark:bg-orange-500/10 border-orange-200/30 dark:border-orange-400/20`,
      'Business Learning': `bg-pink-${baseOpacity}0 dark:bg-pink-500/10 border-pink-200/30 dark:border-pink-400/20`,
    };
    return colors[category as keyof typeof colors] || `bg-violet-${baseOpacity}0 dark:bg-violet-500/10 border-violet-200/30 dark:border-violet-400/20`;
  };

  const toggleDayExpansion = (day: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer ${
        task.completed 
          ? 'opacity-60' 
          : 'hover:shadow-md'
      } ${getCategoryBgColor(task.category, task.completed)} ${
        deletingTasks[task.id] || completingTasks[task.id] ? 'animate-pulse' : ''
      } backdrop-blur-sm`}
      style={{
        borderLeft: `4px solid ${getCategoryColor(task.category)}`
      }}
      onClick={() => !deletingTasks[task.id] && !completingTasks[task.id] && toggleTask(task.id, task.completed)}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 shadow-sm"
        style={{ backgroundColor: getCategoryColor(task.category) }}
      />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-base leading-relaxed transition-all duration-300 ${
          task.completed 
            ? 'line-through text-slate-500 dark:text-slate-400' 
            : 'text-slate-800 dark:text-slate-100'
        }`}>
          {task.name}
        </p>
        <span className="text-sm text-slate-600 dark:text-violet-300 font-medium">
          {task.category}
        </span>
      </div>
      {task.completed && (
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-md">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          deleteTask(task.id, task.name);
        }}
        disabled={deletingTasks[task.id] || completingTasks[task.id]}
        className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex-shrink-0 transition-all duration-200 rounded-lg hover:scale-105"
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
        <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-4 border border-violet-200/50 dark:border-violet-400/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm hover:scale-[1.02]">
          <h3 className="font-semibold text-lg text-violet-800 dark:text-violet-300 mb-4 text-center">
            {day}
          </h3>
          
          {dayTasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                No tasks scheduled
              </p>
            </div>
          ) : hasMultipleTasks ? (
            <Collapsible open={isExpanded} onOpenChange={() => toggleDayExpansion(day)}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto text-base hover:bg-violet-50/80 dark:hover:bg-violet-800/30 text-violet-700 dark:text-violet-300 transition-all duration-200 rounded-xl font-medium"
                  aria-expanded={isExpanded}
                >
                  <span className="flex items-center gap-3">
                    <div className="flex -space-x-1">
                      {dayTasks.slice(0, 3).map((task, index) => (
                        <div
                          key={task.id}
                          className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 transition-all duration-200 hover:scale-110 shadow-sm"
                          style={{ backgroundColor: getCategoryColor(task.category) }}
                          title={task.name}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 bg-slate-300 dark:bg-slate-600 flex items-center justify-center shadow-sm">
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">+</span>
                        </div>
                      )}
                    </div>
                    <span className="leading-relaxed">{isExpanded ? 'Hide Tasks' : 'Show Tasks'} ({dayTasks.length})</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 text-violet-600 dark:text-violet-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3 transition-all duration-300 ease-in-out overflow-hidden">
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
    <Card className="shadow-xl border-violet-200/50 dark:border-violet-400/20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl text-violet-800 dark:text-violet-300 flex items-center gap-3 font-semibold">
          <Calendar className="w-7 h-7" />
          Weekly Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {days.map((day) => (
            <DayCard key={day} day={day} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleBoard;
