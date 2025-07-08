
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, CheckSquare, Plus, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
}

interface PartnerTask {
  id: string;
  title: string;
  completed: boolean;
  created_by: string;
  created_at: string;
}

interface Partner {
  id: string;
  user_id: string;
  partner_id: string;
  partner_email: string;
  chat_room_id: string;
  partner_name?: string;
}

const PartnerChat = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<PartnerTask[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTask, setNewTask] = useState('');
  const [showTasks, setShowTasks] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchPartners();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      fetchMessages();
      fetchTasks();
      setupRealtimeSubscription();
    }
  }, [selectedPartner]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPartners = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .not('chat_room_id', 'is', null);

      if (error) throw error;

      // Get partner profiles separately to avoid relation errors
      const partnersWithProfiles = await Promise.all(
        (data || []).map(async (partner) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', partner.partner_id || partner.user_id)
            .single();

          return {
            ...partner,
            partner_name: profile?.name || partner.partner_email
          };
        })
      );

      setPartners(partnersWithProfiles);
      
      if (partnersWithProfiles.length > 0 && !selectedPartner) {
        setSelectedPartner(partnersWithProfiles[0]);
      }
    } catch (error: any) {
      console.error('Error fetching partners:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedPartner?.chat_room_id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', selectedPartner.chat_room_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles separately to avoid relation errors
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', msg.sender_id)
            .single();

          return {
            ...msg,
            sender_name: profile?.name || 'Unknown'
          };
        })
      );

      setMessages(messagesWithSenders);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchTasks = async () => {
    if (!selectedPartner?.chat_room_id) return;

    try {
      const { data, error } = await supabase
        .from('partner_tasks')
        .select('*')
        .eq('chat_room_id', selectedPartner.chat_room_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!selectedPartner?.chat_room_id) return;

    const channel = supabase
      .channel(`chat-${selectedPartner.chat_room_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${selectedPartner.chat_room_id}`
        },
        () => fetchMessages()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_tasks',
          filter: `chat_room_id=eq.${selectedPartner.chat_room_id}`
        },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPartner?.chat_room_id || !currentUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: selectedPartner.chat_room_id,
          sender_id: currentUser.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createTask = async () => {
    if (!newTask.trim() || !selectedPartner?.chat_room_id || !currentUser) return;

    try {
      const { error } = await supabase
        .from('partner_tasks')
        .insert({
          chat_room_id: selectedPartner.chat_room_id,
          title: newTask.trim(),
          created_by: currentUser.id
        });

      if (error) throw error;
      setNewTask('');
    } catch (error: any) {
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('partner_tasks')
        .update({ completed: !completed })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('partner_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (partners.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-purple-900/20 border-purple-200 dark:border-purple-700 rounded-2xl">
        <CardContent className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-purple-300 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No active partnerships yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Accept a partnership invitation to start collaborating!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      {/* Partner List */}
      <Card className="lg:col-span-1 bg-gradient-to-b from-purple-50 to-indigo-100 dark:from-slate-800 dark:to-purple-900/20 border-purple-200 dark:border-purple-700 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-700 dark:text-purple-300 text-sm">Partners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {partners.map((partner) => (
            <div
              key={partner.id}
              onClick={() => setSelectedPartner(partner)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedPartner?.id === partner.id
                  ? 'bg-purple-200 dark:bg-purple-800 border-purple-300 dark:border-purple-600'
                  : 'bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-100 dark:border-purple-700'
              } border`}
            >
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {partner.partner_name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{partner.partner_email}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Chat & Tasks Panel */}
      <Card className="lg:col-span-2 bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-700 shadow-lg flex flex-col rounded-2xl">
        <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-700 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <CardTitle className="text-purple-700 dark:text-purple-300 text-sm">
              {selectedPartner?.partner_name}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowTasks(false)}
                size="sm"
                variant={!showTasks ? 'default' : 'outline'}
                className={`rounded-lg transition-all duration-200 ${!showTasks ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'}`}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Chat
              </Button>
              <Button
                onClick={() => setShowTasks(true)}
                size="sm"
                variant={showTasks ? 'default' : 'outline'}
                className={`rounded-lg transition-all duration-200 ${showTasks ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'}`}
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                Tasks ({tasks.length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {!showTasks ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        message.sender_id === currentUser?.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-purple-100 dark:border-purple-700">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 border-purple-200 dark:border-purple-700 dark:bg-slate-700 dark:text-white rounded-xl"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-purple-100 dark:border-purple-700"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id, task.completed)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span
                          className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <Button
                        onClick={() => deleteTask(task.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Input */}
              <div className="p-4 border-t border-purple-100 dark:border-purple-700">
                <div className="flex gap-2">
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a shared task..."
                    onKeyPress={(e) => e.key === 'Enter' && createTask()}
                    className="flex-1 border-purple-200 dark:border-purple-700 dark:bg-slate-700 dark:text-white rounded-xl"
                  />
                  <Button
                    onClick={createTask}
                    disabled={!newTask.trim()}
                    className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerChat;
