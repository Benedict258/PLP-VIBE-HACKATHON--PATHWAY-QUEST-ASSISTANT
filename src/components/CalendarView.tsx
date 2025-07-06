
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isSameDay } from 'date-fns';

interface Task {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  created_at: string;
}

interface CalendarTask {
  id: string;
  title: string;
  category: string;
  date: string;
  completed: boolean;
  description?: string;
  time?: string;
}

interface CalendarViewProps {
  tasks?: Task[];
  userPlan: string;
}

const CalendarView = ({ tasks = [], userPlan }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Category colors for dots
  const categoryColors: { [key: string]: string } = {
    'Personal': 'bg-blue-500',
    'Work': 'bg-green-500',
    'Health': 'bg-red-500',
    'Learning': 'bg-yellow-500',
    'Social': 'bg-purple-500',
    'Finance': 'bg-indigo-500',
    'Other': 'bg-gray-500'
  };

  useEffect(() => {
    fetchCalendarTasks();
  }, []);

  const fetchCalendarTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_tasks')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setCalendarTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching calendar tasks:', error);
      toast({
        title: "Error loading calendar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTasksForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return calendarTasks.filter(task => task.date === dateString);
  };

  const getTaskDotsForDate = (date: Date) => {
    const tasksForDate = getTasksForDate(date);
    const categoryCount: { [key: string]: number } = {};
    
    tasksForDate.forEach(task => {
      categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
      color: categoryColors[category] || categoryColors['Other']
    }));
  };

  const renderDayContent = (date: Date) => {
    const dots = getTaskDotsForDate(date);
    
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span className="text-sm">{date.getDate()}</span>
        {dots.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-1 max-w-8 justify-center">
            {dots.slice(0, 3).map(({ category, color, count }, index) => (
              <div key={`${category}-${index}`} className="flex">
                {Array.from({ length: Math.min(count, 3) }).map((_, dotIndex) => (
                  <div
                    key={dotIndex}
                    className={`w-1.5 h-1.5 rounded-full ${color} mr-0.5`}
                  />
                ))}
              </div>
            ))}
            {dots.length > 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            )}
          </div>
        )}
      </div>
    );
  };

  if (userPlan === 'free') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CalendarDays className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <CardTitle className="text-2xl text-gray-600">Calendar View</CardTitle>
          <p className="text-gray-500">
            Upgrade to Premium to access the advanced calendar with color-coded task indicators
          </p>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const selectedTasks = getTasksForDate(selectedDate);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Task Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="w-full"
              components={{
                DayContent: ({ date }) => renderDayContent(date as Date)
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, 'MMM dd, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No tasks scheduled for this date
              </p>
            ) : (
              <div className="space-y-3">
                {selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      categoryColors[task.category]?.replace('bg-', 'border-') || 'border-gray-500'
                    } bg-gray-50 dark:bg-gray-800`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      {task.completed && (
                        <Badge variant="secondary" className="text-xs">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: categoryColors[task.category]?.replace('bg-', ''),
                          color: categoryColors[task.category]?.replace('bg-', '')
                        }}
                      >
                        {task.category}
                      </Badge>
                      {task.time && (
                        <span className="text-xs text-gray-500">{task.time}</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm">{category}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
