
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TaskFormProps {
  onTaskAdded: () => void;
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

const TaskForm = ({ onTaskAdded }: TaskFormProps) => {
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState('');
  const [day, setDay] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      
      // Set first category as default if available
      if (data && data.length > 0 && !category) {
        setCategory(data[0].name);
      }
    } catch (error: any) {
      toast({
        title: "Error loading categories",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !category || !day) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please log in to add tasks.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          name: taskName.trim(),
          category,
          day,
          completed: false
        });

      if (error) throw error;

      setTaskName('');
      setDay('');
      onTaskAdded();
      
      toast({
        title: "Task added!",
        description: `Added "${taskName}" to ${day}`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding task",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-purple-200 dark:border-purple-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-colors duration-300">
      <CardHeader>
        <CardTitle className="text-xl text-purple-800 dark:text-purple-200 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Task
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskName" className="text-purple-700 dark:text-purple-300 font-medium">Task Name</Label>
            <Input
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              required
              className="border-purple-200 dark:border-purple-700 focus:border-purple-400 focus:ring-purple-400 dark:bg-gray-700 dark:text-white transition-colors rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700 dark:text-purple-300 font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="border-purple-200 dark:border-purple-700 focus:border-purple-400 focus:ring-purple-400 dark:bg-gray-700 dark:text-white rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-purple-700 rounded-xl">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name} className="dark:text-white dark:focus:bg-purple-700">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700 dark:text-purple-300 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Day
            </Label>
            <Select value={day} onValueChange={setDay} required>
              <SelectTrigger className="border-purple-200 dark:border-purple-700 focus:border-purple-400 focus:ring-purple-400 dark:bg-gray-700 dark:text-white rounded-xl">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-purple-700 rounded-xl">
                {days.map((d) => (
                  <SelectItem key={d} value={d} className="dark:text-white dark:focus:bg-purple-700">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </div>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskForm;
