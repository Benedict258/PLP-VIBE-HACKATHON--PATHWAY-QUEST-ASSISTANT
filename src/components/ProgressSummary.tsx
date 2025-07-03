
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ProgressSummaryProps {
  tasks: Task[];
}

const ProgressSummary = ({ tasks }: ProgressSummaryProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getCategoryProgress = (categoryName: string) => {
    const categoryTasks = tasks.filter(task => task.category === categoryName);
    if (categoryTasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = categoryTasks.filter(task => task.completed).length;
    const percentage = Math.round((completed / categoryTasks.length) * 100);
    
    return {
      completed,
      total: categoryTasks.length,
      percentage
    };
  };

  const overallProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <Card className="shadow-lg border-purple-200 dark:border-purple-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-colors duration-300">
      <CardHeader>
        <CardTitle className="text-xl text-purple-800 dark:text-purple-200 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-purple-700 dark:text-purple-300">Overall Progress</h4>
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
              {overallProgress()}%
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={overallProgress()} 
              className="h-3 bg-purple-100 dark:bg-purple-900"
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
          </p>
        </div>

        {/* Category Progress */}
        <div className="space-y-4">
          <h4 className="font-semibold text-purple-700 dark:text-purple-300">By Category</h4>
          {categories.map((category) => {
            const progress = getCategoryProgress(category.name);
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {progress.completed}/{progress.total} • {progress.percentage}%
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={progress.percentage} 
                    className="h-2 bg-gray-100 dark:bg-gray-700"
                  />
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                    style={{ 
                      backgroundColor: category.color, 
                      width: `${progress.percentage}%`,
                      opacity: 0.8
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Stats */}
        <div className="pt-4 border-t border-purple-100 dark:border-purple-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 transition-colors">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {tasks.filter(t => t.completed).length}
              </p>
              <p className="text-xs text-purple-500 dark:text-purple-400">Completed</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 transition-colors">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {tasks.filter(t => !t.completed).length}
              </p>
              <p className="text-xs text-amber-500 dark:text-amber-400">Remaining</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressSummary;
