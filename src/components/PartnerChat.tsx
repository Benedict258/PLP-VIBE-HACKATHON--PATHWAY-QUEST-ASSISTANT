
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Plus, CheckSquare, Users, Mail } from 'lucide-react';

interface Partner {
  id: string;
  user_id: string;
  partner_id: string | null;
  partner_email: string;
  status: string;
  chat_room_id: string | null;
  profiles?: {
    name: string;
    first_name: string;
  } | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface PartnerTask {
  id: string;
  title: string;
  completed: boolean;
  created_by: string;
}

const PartnerChat = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerTasks, setPartnerTasks] = useState<PartnerTask[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchPartners();
  }, []);

  useEffect(() => {
    if (selectedPartner?.chat_room_id) {
      fetchMessages();
      fetchPartnerTasks();
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel(`chat_${selectedPartner.chat_room_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_room_id=eq.${selectedPartner.chat_room_id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'partner_tasks',
            filter: `chat_room_id=eq.${selectedPartner.chat_room_id}`
          },
          () => {
            fetchPartnerTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedPartner]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPartners = async () => {
    try {
      // Try to get partners with profiles relation
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          profiles!fk_partner_profile (name, first_name)
        `)
        .eq('status', 'accepted')
        .not('partner_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error fetching partners with profiles:', error);
        // Fallback to basic partner data without profiles
        const { data: basicData, error: basicError } = await supabase
          .from('partners')
          .select('*')
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });
        
        if (basicError) throw basicError;
        
        setPartners(basicData || []);
      } else {
        setPartners(data || []);
      }
      
      if (data && data.length > 0 && !selectedPartner) {
        setSelectedPartner(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error loading partners",
        description: error.message,
        variant: "destructive",
      });
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
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchPartnerTasks = async () => {
    if (!selectedPartner?.chat_room_id) return;

    try {
      const { data, error } = await supabase
        .from('partner_tasks')
        .select('*')
        .eq('chat_room_id', selectedPartner.chat_room_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartnerTasks(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addPartner = async () => {
    if (!newPartnerEmail.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user exists by email in profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', `%${newPartnerEmail}%`);

      if (profileError) throw profileError;

      let partnerId = null;
      if (profiles && profiles.length > 0) {
        partnerId = profiles[0].id;
      }

      // Create chat room first
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .insert({})
        .select()
        .single();

      if (chatError) throw chatError;

      // Create partnership
      const { error } = await supabase
        .from('partners')
        .insert({
          user_id: user.id,
          partner_id: partnerId,
          partner_email: newPartnerEmail.trim(),
          status: 'accepted', // For demo, auto-accept
          chat_room_id: chatRoom.id
        });

      if (error) throw error;

      setNewPartnerEmail('');
      fetchPartners();
      
      toast({
        title: "Partner added",
        description: `Added ${newPartnerEmail} as your study partner!`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding partner",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPartner?.chat_room_id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: selectedPartner.chat_room_id,
          sender_id: currentUserId,
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
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.trim() || !selectedPartner?.chat_room_id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('partner_tasks')
        .insert({
          chat_room_id: selectedPartner.chat_room_id,
          title: newTask.trim(),
          created_by: currentUserId
        });

      if (error) throw error;
      setNewTask('');
      
      toast({
        title: "Task added",
        description: `Added "${newTask}" to shared todos!`,
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPartnerDisplayName = (partner: Partner) => {
    return partner.profiles?.name || partner.partner_email;
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
      {/* Add Partner */}
      <Card className="border-purple-200 bg-white/50 backdrop-blur-sm mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
            <Users className="w-5 h-5" />
            Study Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newPartnerEmail}
              onChange={(e) => setNewPartnerEmail(e.target.value)}
              placeholder="Partner's email"
              className="flex-1"
            />
            <Button
              onClick={addPartner}
              disabled={loading || !newPartnerEmail.trim()}
              className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
            >
              <Mail className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </div>
        </CardContent>
      </Card>

      {partners.length === 0 ? (
        <Card className="border-purple-200 bg-white/50 backdrop-blur-sm flex-1">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No study partners yet. Add one to start collaborating!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          {/* Partner List - Left Panel */}
          <Card className="lg:w-64 border-purple-200 bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Partners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-48 lg:max-h-96 overflow-y-auto">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPartner?.id === partner.id 
                      ? 'bg-purple-100 border-purple-300' 
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  } border`}
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-purple-600">
                    {getInitials(getPartnerDisplayName(partner))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {getPartnerDisplayName(partner)}
                    </p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Area - Right Panel */}
          {selectedPartner && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Shared TODOs Toggle */}
              <div className="mb-4">
                <Button
                  onClick={() => setShowTodos(!showTodos)}
                  variant="outline"
                  className="w-full border-purple-200 hover:bg-purple-50"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Shared TODOs {showTodos ? '(Hide)' : '(Show)'}
                </Button>
              </div>

              {/* TODOs Panel */}
              {showTodos && (
                <Card className="border-purple-200 bg-white/50 backdrop-blur-sm mb-4">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                      <Input
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add shared task"
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                      />
                      <Button
                        onClick={addTask}
                        disabled={loading || !newTask.trim()}
                        className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {partnerTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-2 bg-white rounded border"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id, task.completed)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {partnerTasks.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No shared tasks yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chat Messages */}
              <Card className="flex-1 border-purple-200 bg-white/50 backdrop-blur-sm flex flex-col min-h-0">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
                    <MessageCircle className="w-5 h-5" />
                    Chat with {getPartnerDisplayName(selectedPartner)}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col min-h-0 p-4">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === currentUserId
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === currentUserId ? 'text-purple-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>Start your conversation!</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={loading || !newMessage.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PartnerChat;
