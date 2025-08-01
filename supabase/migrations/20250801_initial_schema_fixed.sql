-- Searchmatic Database Schema - Supabase Compatible Version
-- This migration sets up the complete database schema for the Searchmatic MVP

-- IMPORTANT: Set search path to include extensions schema for Supabase
SET search_path TO public, extensions;

-- Enable required extensions in the extensions schema (Supabase requirement)
-- Note: In Supabase, use "vector" instead of "pgvector"
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA extensions;

-- Create custom types
CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE article_status AS ENUM ('pending', 'processing', 'completed', 'error');
CREATE TYPE article_source AS ENUM ('pubmed', 'scopus', 'wos', 'manual', 'other');
CREATE TYPE screening_decision AS ENUM ('include', 'exclude', 'maybe');

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    organization TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'active',
    protocol JSONB,
    protocol_locked BOOLEAN DEFAULT FALSE,
    protocol_locked_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search queries table
CREATE TABLE IF NOT EXISTS public.search_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    database_name TEXT NOT NULL,
    query_string TEXT NOT NULL,
    result_count INTEGER,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table with vector embeddings
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    external_id TEXT,
    source article_source NOT NULL,
    title TEXT NOT NULL,
    authors TEXT[],
    abstract TEXT,
    publication_date DATE,
    journal TEXT,
    doi TEXT,
    pmid TEXT,
    url TEXT,
    pdf_url TEXT,
    pdf_storage_path TEXT,
    full_text TEXT,
    extracted_data JSONB,
    embedding extensions.vector(1536), -- Supabase vector type with dimension
    status article_status DEFAULT 'pending',
    screening_decision screening_decision,
    screening_notes TEXT,
    duplicate_of UUID REFERENCES public.articles(id),
    similarity_score FLOAT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, source, external_id)
);

-- Chat conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extraction templates table
CREATE TABLE IF NOT EXISTS public.extraction_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    fields JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export logs table
CREATE TABLE IF NOT EXISTS public.export_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT,
    format TEXT,
    filters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_articles_project_id ON public.articles(project_id);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_screening_decision ON public.articles(screening_decision);
CREATE INDEX idx_articles_title_trgm ON public.articles USING gin(title gin_trgm_ops);
CREATE INDEX idx_articles_abstract_trgm ON public.articles USING gin(abstract gin_trgm_ops);

-- Vector similarity search index (using HNSW for Supabase)
CREATE INDEX idx_articles_embedding ON public.articles 
    USING hnsw (embedding extensions.vector_cosine_ops);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_conversations_project_id ON public.conversations(project_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for search_queries table
CREATE POLICY "Users can view search queries for their projects" ON public.search_queries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = search_queries.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create search queries for their projects" ON public.search_queries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = search_queries.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- RLS Policies for articles table
CREATE POLICY "Users can view articles in their projects" ON public.articles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = articles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create articles in their projects" ON public.articles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = articles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update articles in their projects" ON public.articles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = articles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete articles in their projects" ON public.articles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = articles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- RLS Policies for conversations table
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for messages table
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- RLS Policies for extraction_templates table
CREATE POLICY "Users can manage extraction templates for their projects" ON public.extraction_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = extraction_templates.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- RLS Policies for export_logs table
CREATE POLICY "Users can view their own export logs" ON public.export_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export logs" ON public.export_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Utility functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_search_queries_updated_at BEFORE UPDATE ON public.search_queries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_extraction_templates_updated_at BEFORE UPDATE ON public.extraction_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vector similarity search function (optional helper)
CREATE OR REPLACE FUNCTION match_articles(
    query_embedding extensions.vector(1536),
    match_threshold float,
    match_count int,
    project_id_filter uuid
)
RETURNS TABLE (
    id uuid,
    title text,
    abstract text,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        articles.id,
        articles.title,
        articles.abstract,
        1 - (articles.embedding <=> query_embedding) AS similarity
    FROM articles
    WHERE 
        articles.project_id = project_id_filter
        AND articles.embedding IS NOT NULL
        AND 1 - (articles.embedding <=> query_embedding) > match_threshold
    ORDER BY articles.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Note: Storage bucket creation and policies must be done via Supabase Dashboard
-- The following are SQL comments showing what needs to be configured:

-- Storage buckets to create in Dashboard:
-- 1. 'pdfs' - for PDF file uploads
-- 2. 'exports' - for export files

-- Example storage policies (apply in Dashboard after bucket creation):
/*
-- PDFs bucket policies
CREATE POLICY "Users can upload PDFs to their projects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pdfs' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view PDFs in their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'pdfs' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete PDFs from their projects" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pdfs' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Exports bucket policies
CREATE POLICY "Users can download their exports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'exports' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
*/