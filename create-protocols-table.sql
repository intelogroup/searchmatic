-- Create protocols table for research protocol management
CREATE TABLE IF NOT EXISTS protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  research_question TEXT NOT NULL,
  framework_type TEXT NOT NULL CHECK (framework_type IN ('pico', 'spider', 'other')),
  
  -- PICO Framework fields
  population TEXT,
  intervention TEXT,
  comparison TEXT,
  outcome TEXT,
  
  -- SPIDER Framework fields
  sample TEXT,
  phenomenon TEXT,
  design TEXT,
  evaluation TEXT,
  research_type TEXT,
  
  -- Criteria and strategy
  inclusion_criteria TEXT[] DEFAULT '{}',
  exclusion_criteria TEXT[] DEFAULT '{}',
  search_strategy JSONB DEFAULT '{}',
  databases TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  date_range JSONB,
  study_types TEXT[] DEFAULT '{}',
  
  -- Status and versioning
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  
  -- AI assistance tracking
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_guidance_used JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS protocols_project_id_idx ON protocols(project_id);
CREATE INDEX IF NOT EXISTS protocols_user_id_idx ON protocols(user_id);
CREATE INDEX IF NOT EXISTS protocols_status_idx ON protocols(status);
CREATE INDEX IF NOT EXISTS protocols_framework_type_idx ON protocols(framework_type);
CREATE INDEX IF NOT EXISTS protocols_created_at_idx ON protocols(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_protocols_updated_at 
  BEFORE UPDATE ON protocols 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own protocols" ON protocols
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own protocols" ON protocols
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocked protocols" ON protocols
  FOR UPDATE USING (auth.uid() = user_id AND is_locked = FALSE);

CREATE POLICY "Users can delete their own unlocked protocols" ON protocols
  FOR DELETE USING (auth.uid() = user_id AND is_locked = FALSE);

-- Grant necessary permissions
GRANT ALL ON protocols TO authenticated;
GRANT USAGE ON SEQUENCE protocols_id_seq TO authenticated;