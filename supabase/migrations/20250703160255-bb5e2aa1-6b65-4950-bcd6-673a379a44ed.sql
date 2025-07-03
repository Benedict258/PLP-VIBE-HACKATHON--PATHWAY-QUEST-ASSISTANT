
-- Create profiles table for user personalization and streak tracking
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  last_completed_date DATE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark')),
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table for custom user categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can manage their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Create RLS policies for categories
CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- Create function to handle new user signup with profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
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
    (NEW.id, 'Mechatronics & Tech', '#10B981'),
    (NEW.id, 'Schoolwork', '#F59E0B'),
    (NEW.id, 'Business Learning', '#8B5CF6');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update streak when task is completed
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  last_date DATE;
  current_streak_val INTEGER;
BEGIN
  -- Get current streak data
  SELECT last_completed_date, current_streak 
  INTO last_date, current_streak_val
  FROM public.profiles 
  WHERE id = user_uuid;
  
  -- If no previous completion or first completion
  IF last_date IS NULL THEN
    UPDATE public.profiles 
    SET last_completed_date = today_date, current_streak = 1
    WHERE id = user_uuid;
    RETURN;
  END IF;
  
  -- If completed today already, don't update
  IF last_date = today_date THEN
    RETURN;
  END IF;
  
  -- If completed yesterday, increment streak
  IF last_date = today_date - INTERVAL '1 day' THEN
    UPDATE public.profiles 
    SET last_completed_date = today_date, 
        current_streak = current_streak_val + 1
    WHERE id = user_uuid;
  -- If gap in completion, reset streak
  ELSE
    UPDATE public.profiles 
    SET last_completed_date = today_date, 
        current_streak = 1
    WHERE id = user_uuid;
  END IF;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
