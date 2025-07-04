
-- Update profiles table to include plan
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'editor',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team_tasks table
CREATE TABLE public.team_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📁',
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace_tasks table
CREATE TABLE public.workspace_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_email TEXT NOT NULL,
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, partner_email)
);

-- Create calendar_tasks table
CREATE TABLE public.calendar_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  category TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teams
CREATE POLICY "Users can view teams they own or are members of" ON public.teams
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = teams.id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can update their teams" ON public.teams
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams" ON public.teams
  FOR DELETE USING (owner_id = auth.uid());

-- Create RLS policies for team_members  
CREATE POLICY "Users can view team members of teams they belong to" ON public.team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid()) OR
    user_id = auth.uid()
  );

CREATE POLICY "Team owners can manage team members" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  );

-- Create RLS policies for team_tasks
CREATE POLICY "Users can view team tasks of teams they belong to" ON public.team_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_tasks.team_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_tasks.team_id AND owner_id = auth.uid())
  );

CREATE POLICY "Team members can manage team tasks" ON public.team_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_tasks.team_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_tasks.team_id AND owner_id = auth.uid())
  );

-- Create RLS policies for workspaces
CREATE POLICY "Users can manage their own workspaces" ON public.workspaces
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for workspace_tasks
CREATE POLICY "Users can manage their own workspace tasks" ON public.workspace_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for partners
CREATE POLICY "Users can manage their own partnerships" ON public.partners
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Create RLS policies for calendar_tasks
CREATE POLICY "Users can manage their own calendar tasks" ON public.calendar_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_tasks_team_id ON public.team_tasks(team_id);
CREATE INDEX idx_workspaces_user_id ON public.workspaces(user_id);
CREATE INDEX idx_workspace_tasks_workspace_id ON public.workspace_tasks(workspace_id);
CREATE INDEX idx_partners_user_id ON public.partners(user_id);
CREATE INDEX idx_partners_partner_id ON public.partners(partner_id);
CREATE INDEX idx_calendar_tasks_user_id_date ON public.calendar_tasks(user_id, date);

-- Update the handle_new_user function to create default workspaces
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert profile with name from metadata
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User')
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
$function$;
