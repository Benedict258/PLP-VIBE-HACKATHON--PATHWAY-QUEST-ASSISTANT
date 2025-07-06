
import React from 'react';
import { X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface CalendarTask {
  id: string;
  title: string;
  category: string;
  date: string;
  completed: boolean;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  tasks: CalendarTask[];
}

const CalendarModal = ({ isOpen, onClose, selectedDate, tasks }: CalendarModalProps) => {
  if (!isOpen) return null;

  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, CalendarTask[]>);

  const totalTasks = tasks.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
              Tasks on {format(selectedDate, 'MMMM do')}
              <span className="text-purple-600">({totalTasks})</span>
            </CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {totalTasks === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No tasks scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
                <div
                  key={category}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-l-4 border-purple-500"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-purple-700 dark:text-purple-300">
                      {category}
                    </h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({categoryTasks.length} task{categoryTasks.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {categoryTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`text-sm ${
                          task.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        • {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarModal;
