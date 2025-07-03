
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface TaskFormProps {
  onTaskAdded: () => void;
}

const categories = [
  'Programming',
  'Mechatronics & Tech',
  'Schoolwork',
  'Business Learning'
];

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
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [day, setDay] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !day) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert({
          name,
          category,
          day,
          user_id: user.id,
        });

      if (error) throw error;

      setName('');
      setCategory('');
      setDay('');
      onTaskAdded();
      toast({
        title: "Task added!",
        description: `Added "${name}" to ${day}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-purple-200 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Task
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskName" className="text-purple-700">Task Name</Label>
            <Input
              id="taskName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              required
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-purple-700">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 focus:ring-purple-400">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700">Day</Label>
            <Select value={day} onValueChange={setDay} required>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 focus:ring-purple-400">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={loading || !name || !category || !day}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
          >
            {loading ? 'Adding...' : 'Add Task'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskForm;
