
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarTask {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  category: string;
  completed: boolean;
}

interface CalendarViewProps {
  userPlan: string;
}

const CalendarView = ({ userPlan }: CalendarViewProps) => {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userPlan !== 'free') {
      fetchCalendarTasks();
    }
  }, [currentDate, userPlan]);

  const fetchCalendarTasks = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('calendar_tasks')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading calendar tasks",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getTasksForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0];
    return tasks.filter(task => task.date === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (userPlan === 'free') {
    return (
      <Card className="border-purple-200 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Calendar className="w-5 h-5" />
            Calendar View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Calendar View
            </h3>
            <p className="text-gray-500 mb-6">
              Visualize your tasks and schedule in a beautiful monthly calendar
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-purple-700 font-medium mb-2">🔒 Premium Feature</p>
              <p className="text-purple-600">
                Upgrade to Premium to access the calendar view and advanced scheduling features
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-purple-200 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Calendar className="w-5 h-5" />
            Calendar View
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={goToPreviousMonth}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-semibold min-w-[140px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button
                onClick={goToNextMonth}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth().map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-square p-1"></div>;
            }
            
            const dayTasks = getTasksForDate(day);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
            
            return (
              <div
                key={day}
                className={`aspect-square p-1 border border-gray-100 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors ${
                  isToday ? 'bg-purple-100 border-purple-300' : ''
                }`}
                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
              >
                <div className="h-full flex flex-col">
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-purple-700' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="flex-1 space-y-1">
                    {dayTasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className={`text-xs p-1 rounded truncate ${
                          task.completed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}
                        title={task.title}
                      >
                        {task.time && (
                          <Clock className="w-2 h-2 inline mr-1" />
                        )}
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedDate && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-3">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
            <div className="space-y-2">
              {getTasksForDate(selectedDate.getDate()).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    task.completed ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.time && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.time}
                      </div>
                    )}
                  </div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {task.category}
                  </div>
                </div>
              ))}
              {getTasksForDate(selectedDate.getDate()).length === 0 && (
                <p className="text-gray-500 text-center py-4">No tasks scheduled for this day</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarView;
