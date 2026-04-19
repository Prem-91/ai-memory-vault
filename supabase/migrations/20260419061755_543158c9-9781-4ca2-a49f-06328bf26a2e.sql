
-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  memory_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE USING (auth.uid() = id);

-- =========================================
-- PROJECTS
-- =========================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goals TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  constraints TEXT,
  progress_notes TEXT,
  color TEXT DEFAULT '#7c3aed',
  is_active BOOLEAN NOT NULL DEFAULT false,
  memory_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- =========================================
-- MEMORIES
-- =========================================
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  raw_content TEXT,
  summary TEXT,
  key_points TEXT[] DEFAULT '{}',
  decisions TEXT[] DEFAULT '{}',
  open_questions TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  source_platform TEXT DEFAULT 'manual',
  capture_method TEXT DEFAULT 'manual',
  relevance_score FLOAT NOT NULL DEFAULT 0.0,
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memories"
  ON public.memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own memories"
  ON public.memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memories"
  ON public.memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memories"
  ON public.memories FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_memories_user_id ON public.memories(user_id);
CREATE INDEX idx_memories_project_id ON public.memories(project_id);
CREATE INDEX idx_memories_created_at ON public.memories(created_at DESC);
CREATE INDEX idx_memories_search ON public.memories USING GIN (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(raw_content,''))
);

-- =========================================
-- CONTEXT INJECTIONS
-- =========================================
CREATE TABLE public.context_injections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  memories_used UUID[] DEFAULT '{}',
  injected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  platform TEXT
);

ALTER TABLE public.context_injections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own injections"
  ON public.context_injections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own injections"
  ON public.context_injections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own injections"
  ON public.context_injections FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_injections_user_id ON public.context_injections(user_id);
CREATE INDEX idx_injections_injected_at ON public.context_injections(injected_at DESC);

-- =========================================
-- updated_at trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Auto-create profile on signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- Memory count triggers
-- =========================================
CREATE OR REPLACE FUNCTION public.bump_memory_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET memory_count = memory_count + 1 WHERE id = NEW.user_id;
    IF NEW.project_id IS NOT NULL THEN
      UPDATE public.projects SET memory_count = memory_count + 1 WHERE id = NEW.project_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET memory_count = GREATEST(memory_count - 1, 0) WHERE id = OLD.user_id;
    IF OLD.project_id IS NOT NULL THEN
      UPDATE public.projects SET memory_count = GREATEST(memory_count - 1, 0) WHERE id = OLD.project_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER memories_count_trigger
  AFTER INSERT OR DELETE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.bump_memory_counts();

-- =========================================
-- Realtime
-- =========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER TABLE public.memories REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;

-- =========================================
-- Storage: avatars bucket
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
