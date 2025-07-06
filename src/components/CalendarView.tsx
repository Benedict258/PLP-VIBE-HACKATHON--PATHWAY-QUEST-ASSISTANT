
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import CalendarModal from './CalendarModal';

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
  const [showModal, setShowModal] = useState(false);
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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setShowModal(true);
    }
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
    <div className="w-full max-w-6xl mx-auto">
      {/* Main Calendar - Full Screen */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="w-6 h-6" />
            Task Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="w-full mx-auto"
            components={{
              DayContent: ({ date }) => renderDayContent(date as Date)
            }}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-1 relative items-center text-lg font-semibold",
              table: "w-full border-collapse space-y-2",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-sm text-center p-2",
              row: "flex w-full mt-2",
              cell: "flex-1 h-14 text-center text-sm p-1 relative hover:bg-accent rounded-md transition-colors cursor-pointer",
              day: "h-full w-full p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors flex flex-col items-center justify-center"
            }}
          />
        </CardContent>
      </Card>

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedDate={selectedDate}
        tasks={selectedTasks}
      />
    </div>
  );
};

export default CalendarView;
