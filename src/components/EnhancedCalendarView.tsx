
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, Plus, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Task {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  venue?: string;
}

interface CalendarTask {
  id: string;
  title: string;
  category: string;
  date: string;
  completed: boolean;
}

interface EnhancedCalendarViewProps {
  tasks?: Task[];
  userPlan: string;
}

const EnhancedCalendarView = ({ tasks = [], userPlan }: EnhancedCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    venue: ''
  });
  const [showDayModal, setShowDayModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchCalendarTasks();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
    }
  };

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
    }
  };

  const createEvent = async () => {
    if (!newEvent.title.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          title: newEvent.title.trim(),
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: newEvent.time || null,
          venue: newEvent.venue || null
        });

      if (error) throw error;

      setNewEvent({ title: '', time: '', venue: '' });
      setShowEventForm(false);
      fetchEvents();
      
      toast({
        title: "Event created",
        description: `"${newEvent.title}" added to ${format(selectedDate, 'MMM dd, yyyy')}`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTasksForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return calendarTasks.filter(task => task.date === dateString);
  };

  const getEventsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateString);
  };

  const getTotalItemsForDate = (date: Date) => {
    return getTasksForDate(date).length + getEventsForDate(date).length;
  };

  const getTasksByCategory = (date: Date) => {
    const tasksForDate = getTasksForDate(date);
    const categoryCount: { [key: string]: number } = {};
    
    tasksForDate.forEach(task => {
      categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
    });

    return categoryCount;
  };

  const renderDayContent = (date: Date) => {
    const totalItems = getTotalItemsForDate(date);
    const hasEvents = getEventsForDate(date).length > 0;
    
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span className="text-sm font-medium">{date.getDate()}</span>
        {totalItems > 0 && (
          <div className="flex items-center justify-center mt-1">
            {hasEvents && (
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 mr-1 shadow-lg animate-pulse" />
            )}
            <div className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
              {totalItems}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const totalItems = getTotalItemsForDate(date);
      if (totalItems > 0 || showEventForm) {
        setShowDayModal(true);
      } else {
        setShowEventForm(true);
      }
    }
  };

  if (userPlan === 'free') {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="text-center">
          <CalendarDays className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <CardTitle className="text-2xl text-gray-600">Enhanced Calendar</CardTitle>
          <p className="text-gray-500">
            Upgrade to Premium to access the advanced calendar with events and task management
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Main Calendar */}
      <Card className="w-full bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-blue-700">
            <CalendarDays className="w-6 h-6" />
            Enhanced Calendar
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
              caption: "flex justify-center pt-1 relative items-center text-lg font-semibold text-blue-700",
              table: "w-full border-collapse space-y-2",
              head_row: "flex w-full",
              head_cell: "text-blue-600 rounded-md flex-1 font-medium text-sm text-center p-3",
              row: "flex w-full mt-2",
              cell: "flex-1 h-16 text-center text-sm p-1 relative hover:bg-blue-50 rounded-lg transition-colors cursor-pointer",
              day: "h-full w-full p-0 font-normal hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors flex flex-col items-center justify-center",
              day_selected: "bg-blue-600 text-white hover:bg-blue-700",
              day_today: "bg-blue-100 text-blue-700 font-semibold"
            }}
          />

          {/* Event Creation Form */}
          {showEventForm && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">
                Create Event for {format(selectedDate, 'MMMM dd, yyyy')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Event title"
                  className="bg-white border-blue-200 focus:border-blue-400"
                />
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="bg-white border-blue-200 focus:border-blue-400"
                />
                <Input
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  placeholder="Venue (optional)"
                  className="bg-white border-blue-200 focus:border-blue-400"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={createEvent}
                  disabled={!newEvent.title.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
                <Button
                  onClick={() => setShowEventForm(false)}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Details Modal */}
      {showDayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-700">
                {format(selectedDate, 'MMMM dd, yyyy')}
              </CardTitle>
              <p className="text-sm text-blue-600">
                {getTotalItemsForDate(selectedDate)} items scheduled
              </p>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {/* Events */}
              {getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">{event.title}</p>
                      {event.time && (
                        <p className="text-sm text-blue-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </p>
                      )}
                      {event.venue && (
                        <p className="text-sm text-blue-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Tasks by Category */}
              {Object.entries(getTasksByCategory(selectedDate)).map(([category, count]) => (
                <div key={category} className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-medium text-gray-900">{category}</p>
                  <p className="text-sm text-gray-600">{count} task{count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </CardContent>
            <div className="p-4 border-t flex gap-2">
              <Button
                onClick={() => {
                  setShowDayModal(false);
                  setShowEventForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
              <Button
                onClick={() => setShowDayModal(false)}
                variant="outline"
                className="border-blue-200 text-blue-600"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedCalendarView;
