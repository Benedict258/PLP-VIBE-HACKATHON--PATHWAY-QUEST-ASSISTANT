
-- Create invites table for team and partnership invitations
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('team', 'partner')),
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_email TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on invites table
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites sent to them or by them
CREATE POLICY "Users can view their invites" ON public.invites
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    receiver_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can create invites
CREATE POLICY "Users can create invites" ON public.invites
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update invites sent to them
CREATE POLICY "Users can update received invites" ON public.invites
  FOR UPDATE USING (
    receiver_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create events table for calendar events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  venue TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Users can manage their own events
CREATE POLICY "Users can manage their own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notifications
CREATE POLICY "Users can manage their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Add email column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer set search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, first_name, last_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  );
  
  -- Insert default categories for new user
  INSERT INTO public.categories (user_id, name, color) VALUES
    (NEW.id, 'Programming', '#3B82F6'),
    (NEW.id, 'Learning & Development', '#10B981'),
    (NEW.id, 'Work Tasks', '#F59E0B'),
    (NEW.id, 'Personal Goals', '#8B5CF6');
  
  -- Insert default workspaces for new user
  INSERT INTO public.workspaces (user_id, name, emoji, color) VALUES
    (NEW.id, 'Personal', '🏠', '#8B5CF6');
  
  RETURN NEW;
END;
$$;

-- Fix team_tasks day constraint to allow proper date format
ALTER TABLE public.team_tasks DROP CONSTRAINT IF EXISTS team_tasks_day_check;
ALTER TABLE public.team_tasks ADD CONSTRAINT team_tasks_day_check 
  CHECK (day ~ '^\d{4}-\d{2}-\d{2}$');

-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.messages;

-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.notifications;
