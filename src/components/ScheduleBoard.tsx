
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Calendar } from 'lucide-react';

interface Task {
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
    }
  };

  const getTasksForDay = (day: string) => {
    return tasks.filter(task => task.day === day);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Programming': 'bg-blue-100 text-blue-800 border-blue-200',
      'Mechatronics & Tech': 'bg-green-100 text-green-800 border-green-200',
      'Schoolwork': 'bg-orange-100 text-orange-800 border-orange-200',
      'Business Learning': 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className="shadow-lg border-purple-200 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-purple-800 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Weekly Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            return (
              <div
                key={day}
                className="bg-white/70 rounded-lg p-4 border border-purple-100 shadow-sm"
              >
                <h3 className="font-semibold text-purple-800 mb-3 text-center">
                  {day}
                </h3>
                <div className="space-y-2">
                  {dayTasks.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No tasks scheduled
                    </p>
                  ) : (
                    dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border transition-all hover:shadow-md ${
                          task.completed 
                            ? 'bg-green-50 border-green-200 opacity-75' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(task.id, task.completed)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${
                              task.completed 
                                ? 'line-through text-gray-500' 
                                : 'text-gray-800'
                            }`}>
                              {task.name}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getCategoryColor(task.category)}`}>
                              {task.category}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id, task.name)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleBoard;
