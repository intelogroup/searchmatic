export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          organization: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          organization?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          organization?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          project_type: 'systematic_review' | 'meta_analysis' | 'scoping_review' | 'narrative_review' | 'umbrella_review' | 'custom'
          status: 'draft' | 'active' | 'review' | 'completed' | 'archived'
          research_domain: string | null
          progress_percentage: number
          current_stage: string
          last_activity_at: string
          protocol: Json | null
          protocol_locked: boolean
          protocol_locked_at: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          project_type?: 'systematic_review' | 'meta_analysis' | 'scoping_review' | 'narrative_review' | 'umbrella_review' | 'custom'
          status?: 'draft' | 'active' | 'review' | 'completed' | 'archived'
          research_domain?: string | null
          progress_percentage?: number
          current_stage?: string
          last_activity_at?: string
          protocol?: Json | null
          protocol_locked?: boolean
          protocol_locked_at?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          project_type?: 'systematic_review' | 'meta_analysis' | 'scoping_review' | 'narrative_review' | 'umbrella_review' | 'custom'
          status?: 'draft' | 'active' | 'review' | 'completed' | 'archived'
          research_domain?: string | null
          progress_percentage?: number
          current_stage?: string
          last_activity_at?: string
          protocol?: Json | null
          protocol_locked?: boolean
          protocol_locked_at?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      search_queries: {
        Row: {
          id: string
          project_id: string
          database_name: string
          query_string: string
          result_count: number | null
          executed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          database_name: string
          query_string: string
          result_count?: number | null
          executed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          database_name?: string
          query_string?: string
          result_count?: number | null
          executed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          project_id: string
          external_id: string | null
          source: 'pubmed' | 'scopus' | 'wos' | 'manual' | 'other'
          title: string
          authors: string[] | null
          abstract: string | null
          publication_date: string | null
          journal: string | null
          doi: string | null
          pmid: string | null
          url: string | null
          pdf_url: string | null
          pdf_storage_path: string | null
          full_text: string | null
          extracted_data: Json | null
          embedding: number[] | null
          status: 'pending' | 'processing' | 'completed' | 'error'
          screening_decision: 'include' | 'exclude' | 'maybe' | null
          screening_notes: string | null
          duplicate_of: string | null
          similarity_score: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          external_id?: string | null
          source: 'pubmed' | 'scopus' | 'wos' | 'manual' | 'other'
          title: string
          authors?: string[] | null
          abstract?: string | null
          publication_date?: string | null
          journal?: string | null
          doi?: string | null
          pmid?: string | null
          url?: string | null
          pdf_url?: string | null
          pdf_storage_path?: string | null
          full_text?: string | null
          extracted_data?: Json | null
          embedding?: number[] | null
          status?: 'pending' | 'processing' | 'completed' | 'error'
          screening_decision?: 'include' | 'exclude' | 'maybe' | null
          screening_notes?: string | null
          duplicate_of?: string | null
          similarity_score?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          external_id?: string | null
          source?: 'pubmed' | 'scopus' | 'wos' | 'manual' | 'other'
          title?: string
          authors?: string[] | null
          abstract?: string | null
          publication_date?: string | null
          journal?: string | null
          doi?: string | null
          pmid?: string | null
          url?: string | null
          pdf_url?: string | null
          pdf_storage_path?: string | null
          full_text?: string | null
          extracted_data?: Json | null
          embedding?: number[] | null
          status?: 'pending' | 'processing' | 'completed' | 'error'
          screening_decision?: 'include' | 'exclude' | 'maybe' | null
          screening_notes?: string | null
          duplicate_of?: string | null
          similarity_score?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string | null
          context: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title?: string | null
          context?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          title?: string | null
          context?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json
          created_at?: string
        }
      }
      extraction_templates: {
        Row: {
          id: string
          project_id: string
          name: string
          fields: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          fields: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          fields?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      export_logs: {
        Row: {
          id: string
          project_id: string
          user_id: string
          file_path: string | null
          format: string | null
          filters: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          file_path?: string | null
          format?: string | null
          filters?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          file_path?: string | null
          format?: string | null
          filters?: Json | null
          created_at?: string
        }
      }
      protocols: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string
          description: string | null
          research_question: string
          framework_type: 'pico' | 'spider' | 'other'
          population: string | null
          intervention: string | null
          comparison: string | null
          outcome: string | null
          sample: string | null
          phenomenon: string | null
          design: string | null
          evaluation: string | null
          research_type: string | null
          inclusion_criteria: string[]
          exclusion_criteria: string[]
          search_strategy: Json
          databases: string[]
          keywords: string[]
          date_range: Json | null
          study_types: string[]
          status: 'draft' | 'active' | 'completed' | 'archived'
          is_locked: boolean
          locked_at: string | null
          version: number
          ai_generated: boolean
          ai_guidance_used: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title: string
          description?: string | null
          research_question: string
          framework_type: 'pico' | 'spider' | 'other'
          population?: string | null
          intervention?: string | null
          comparison?: string | null
          outcome?: string | null
          sample?: string | null
          phenomenon?: string | null
          design?: string | null
          evaluation?: string | null
          research_type?: string | null
          inclusion_criteria?: string[]
          exclusion_criteria?: string[]
          search_strategy?: Json
          databases?: string[]
          keywords?: string[]
          date_range?: Json | null
          study_types?: string[]
          status?: 'draft' | 'active' | 'completed' | 'archived'
          is_locked?: boolean
          locked_at?: string | null
          version?: number
          ai_generated?: boolean
          ai_guidance_used?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          title?: string
          description?: string | null
          research_question?: string
          framework_type?: 'pico' | 'spider' | 'other'
          population?: string | null
          intervention?: string | null
          comparison?: string | null
          outcome?: string | null
          sample?: string | null
          phenomenon?: string | null
          design?: string | null
          evaluation?: string | null
          research_type?: string | null
          inclusion_criteria?: string[]
          exclusion_criteria?: string[]
          search_strategy?: Json
          databases?: string[]
          keywords?: string[]
          date_range?: Json | null
          study_types?: string[]
          status?: 'draft' | 'active' | 'completed' | 'archived'
          is_locked?: boolean
          locked_at?: string | null
          version?: number
          ai_generated?: boolean
          ai_guidance_used?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      article_source: 'pubmed' | 'scopus' | 'wos' | 'manual' | 'other'
      article_status: 'pending' | 'processing' | 'completed' | 'error'
      project_status: 'draft' | 'active' | 'review' | 'completed' | 'archived'
      project_type: 'systematic_review' | 'meta_analysis' | 'scoping_review' | 'narrative_review' | 'umbrella_review' | 'custom'
      screening_decision: 'include' | 'exclude' | 'maybe'
      protocol_framework_type: 'pico' | 'spider' | 'other'
      protocol_status: 'draft' | 'active' | 'completed' | 'archived'
    }
  }
}