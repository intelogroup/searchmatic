-- Step 3: Create Studies Table
-- Execute this after Step 2

CREATE TABLE IF NOT EXISTS studies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    title TEXT NOT NULL,
    authors TEXT,
    publication_year INTEGER,
    journal TEXT,
    doi TEXT,
    pmid TEXT,
    isbn TEXT,
    url TEXT,
    
    -- Study Classification
    study_type study_type NOT NULL DEFAULT 'article',
    status study_status NOT NULL DEFAULT 'pending',
    
    -- Content
    abstract TEXT,
    keywords TEXT[],
    full_text TEXT,
    citation TEXT,
    
    -- Processing
    pdf_url TEXT,
    pdf_processed BOOLEAN DEFAULT FALSE,
    extraction_data JSONB DEFAULT '{}',
    screening_notes TEXT,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 10),
    
    -- Deduplication
    similarity_hash TEXT,
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of UUID REFERENCES studies(id),
    
    -- AI Processing
    ai_summary TEXT,
    ai_tags TEXT[],
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);