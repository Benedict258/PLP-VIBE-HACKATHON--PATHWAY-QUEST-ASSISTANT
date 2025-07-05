
-- First, let's ensure we have all the necessary tables and fix any missing structures

-- Add missing columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Create chat_rooms table for partner messaging
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create partner_tasks table for shared todo lists
CREATE TABLE IF NOT EXISTS public.partner_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Update partners table to include chat_room_id
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS chat_room_id UUID REFERENCES public.chat_rooms(id);

-- Enable RLS on new tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_rooms
CREATE POLICY "Users can view chat rooms they participate in" 
ON public.chat_rooms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.partners 
    WHERE chat_room_id = chat_rooms.id 
    AND (user_id = auth.uid() OR partner_id = auth.uid())
    AND status = 'accepted'
  )
);

CREATE POLICY "Users can create chat rooms" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their chat rooms" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.partners 
    WHERE chat_room_id = messages.chat_room_id 
    AND (user_id = auth.uid() OR partner_id = auth.uid())
    AND status = 'accepted'
  )
);

CREATE POLICY "Users can send messages to their chat rooms" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.partners 
    WHERE chat_room_id = messages.chat_room_id 
    AND (user_id = auth.uid() OR partner_id = auth.uid())
    AND status = 'accepted'
  )
);

-- Create RLS policies for partner_tasks
CREATE POLICY "Users can manage partner tasks in their chat rooms" 
ON public.partner_tasks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.partners 
    WHERE chat_room_id = partner_tasks.chat_room_id 
    AND (user_id = auth.uid() OR partner_id = auth.uid())
    AND status = 'accepted'
  )
);

-- Update handle_new_user function to include first_name and last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert profile with name from metadata
  INSERT INTO public.profiles (id, name, first_name, last_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  );
  
  -- Insert default categories for new user
  INSERT INTO public.categories (user_id, name, color) VALUES
    (NEW.id, 'Programming', '#3B82F6'),
    (NEW.id, 'Learning & Development', '#10B981'),
    (NEW.id, 'Work Tasks', '#F59E0B'),
    (NEW.id, 'Personal Goals', '#8B5CF6');
  
  -- Insert default workspaces for new user
  INSERT INTO public.workspaces (user_id, name, emoji, color) VALUES
    (NEW.id, 'Personal', '🏠', '#8B5CF6'),
    (NEW.id, 'Work', '💼', '#3B82F6'),
    (NEW.id, 'Learning', '📚', '#10B981');
  
  RETURN NEW;
END;
$$;
