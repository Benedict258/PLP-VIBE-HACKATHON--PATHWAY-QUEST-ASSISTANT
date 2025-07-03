
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Star, CheckCircle } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  category: string;
  day: string;
  completed: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  tasks: Task[];
}

const NotificationPanel = ({ tasks }: NotificationPanelProps) => {
  const getNextPendingTask = () => {
    const pendingTasks = tasks.filter(task => !task.completed);
    if (pendingTasks.length === 0) return null;
    
    // Sort by creation date to get the oldest pending task
    return pendingTasks.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];
  };

  const getRecentCompletions = () => {
    return tasks
      .filter(task => task.completed)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  const nextTask = getNextPendingTask();
  const recentCompletions = getRecentCompletions();

  const getCategoryColor = (category: string) => {
    const colors = {
      'Programming': 'text-blue-600 bg-blue-50',
      'Mechatronics & Tech': 'text-green-600 bg-green-50',
      'Schoolwork': 'text-orange-600 bg-orange-50',
      'Business Learning': 'text-pink-600 bg-pink-50',
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  return (
    <Card className="shadow-lg border-purple-200 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Next Pending Task */}
        <div className="space-y-3">
          <h4 className="font-semibold text-purple-700 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Next Up
          </h4>
          {nextTask ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 rounded-full p-2">
                  <Star className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 mb-1">
                    {nextTask.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(nextTask.category)}`}>
                      {nextTask.category}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">{nextTask.day}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-800 font-medium">All caught up! 🎉</p>
              <p className="text-green-600 text-sm">No pending tasks</p>
            </div>
          )}
        </div>

        {/* Recent Completions */}
        <div className="space-y-3">
          <h4 className="font-semibold text-purple-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Recent Completions
          </h4>
          <div className="space-y-2">
            {recentCompletions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No completed tasks yet
              </p>
            ) : (
              recentCompletions.map((task, index) => (
                <div
                  key={task.id}
                  className="bg-green-50 border border-green-100 rounded-lg p-3 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-gray-800 truncate">
                      Congrats! You completed "{task.name}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
                      {task.category}
                    </span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{task.day}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Motivational Message */}
        {tasks.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4">
            <p className="text-purple-800 font-medium text-center">
              {tasks.filter(t => t.completed).length === tasks.length
                ? "Perfect week! You're crushing it! 🚀"
                : `Keep going! ${tasks.filter(t => !t.completed).length} tasks to go 💪`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationPanel;
