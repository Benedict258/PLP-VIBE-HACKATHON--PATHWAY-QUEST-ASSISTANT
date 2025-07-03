
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  category: string;
  day: string;
  completed: boolean;
  created_at: string;
}

interface ProgressSummaryProps {
  tasks: Task[];
}

const categories = [
  'Programming',
  'Mechatronics & Tech',
  'Schoolwork',
  'Business Learning'
];

const ProgressSummary = ({ tasks }: ProgressSummaryProps) => {
  const getCategoryProgress = (category: string) => {
    const categoryTasks = tasks.filter(task => task.category === category);
    if (categoryTasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = categoryTasks.filter(task => task.completed).length;
    const percentage = Math.round((completed / categoryTasks.length) * 100);
    
    return {
      completed,
      total: categoryTasks.length,
      percentage
    };
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Programming': 'from-blue-500 to-blue-600',
      'Mechatronics & Tech': 'from-green-500 to-green-600',
      'Schoolwork': 'from-orange-500 to-orange-600',
      'Business Learning': 'from-pink-500 to-pink-600',
    };
    return colors[category as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const overallProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <Card className="shadow-lg border-purple-200 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-purple-700">Overall Progress</h4>
            <span className="text-sm font-medium text-purple-600">
              {overallProgress()}%
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={overallProgress()} 
              className="h-3 bg-purple-100"
            />
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress()}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
          </p>
        </div>

        {/* Category Progress */}
        <div className="space-y-4">
          <h4 className="font-semibold text-purple-700">By Category</h4>
          {categories.map((category) => {
            const progress = getCategoryProgress(category);
            return (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {category}
                  </span>
                  <span className="text-xs text-gray-600">
                    {progress.completed}/{progress.total} • {progress.percentage}%
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={progress.percentage} 
                    className="h-2 bg-gray-100"
                  />
                  <div 
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getCategoryColor(category)} rounded-full transition-all duration-500`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Stats */}
        <div className="pt-4 border-t border-purple-100">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-purple-600">
                {tasks.filter(t => t.completed).length}
              </p>
              <p className="text-xs text-purple-500">Completed</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-amber-600">
                {tasks.filter(t => !t.completed).length}
              </p>
              <p className="text-xs text-amber-500">Remaining</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressSummary;
