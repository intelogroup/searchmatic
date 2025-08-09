// Edge Function for searching research databases
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  projectId: string
  query: string
  databases: ('pubmed' | 'scopus' | 'wos')[]
  maxResults?: number
  filters?: {
    dateFrom?: string
    dateTo?: string
    language?: string
    studyTypes?: string[]
  }
}

interface Article {
  external_id: string
  source: string
  title: string
  authors?: string[]
  abstract?: string
  publication_date?: string
  journal?: string
  doi?: string
  pmid?: string
  url?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { projectId, query, databases, maxResults = 100, filters = {} }: SearchRequest = await req.json()

    // Validate project ownership
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const results: Article[] = []

    // Search PubMed
    if (databases.includes('pubmed')) {
      const pubmedResults = await searchPubMed(query, maxResults, filters)
      results.push(...pubmedResults)
    }

    // Search Scopus (placeholder - would need API key)
    if (databases.includes('scopus')) {
      console.log('Scopus search requested but not implemented - requires API key')
    }

    // Search Web of Science (placeholder - would need API key)  
    if (databases.includes('wos')) {
      console.log('WoS search requested but not implemented - requires API key')
    }

    // Store search query for tracking
    await supabaseClient
      .from('search_queries')
      .insert({
        project_id: projectId,
        database_name: databases.join(','),
        query_string: query,
        result_count: results.length,
        executed_at: new Date().toISOString()
      })

    // Store articles in database
    if (results.length > 0) {
      const articlesToInsert = results.map(article => ({
        project_id: projectId,
        external_id: article.external_id,
        source: article.source,
        title: article.title,
        authors: article.authors || null,
        abstract: article.abstract || null,
        publication_date: article.publication_date || null,
        journal: article.journal || null,
        doi: article.doi || null,
        pmid: article.pmid || null,
        url: article.url || null,
        status: 'pending',
        metadata: {}
      }))

      const { data: insertedArticles, error: insertError } = await supabaseClient
        .from('articles')
        .upsert(articlesToInsert, { 
          onConflict: 'project_id,external_id',
          ignoreDuplicates: true 
        })
        .select()

      if (insertError) {
        console.error('Error inserting articles:', insertError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: results.length,
        articles: results,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Search Articles Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// PubMed search implementation
async function searchPubMed(query: string, maxResults: number, filters: any): Promise<Article[]> {
  try {
    // Build PubMed search URL
    let searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?`
    searchUrl += `db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`

    if (filters.dateFrom) {
      searchUrl += `&mindate=${filters.dateFrom.replace(/-/g, '/')}`
    }
    if (filters.dateTo) {
      searchUrl += `&maxdate=${filters.dateTo.replace(/-/g, '/')}`
    }

    // Search PubMed for article IDs
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`PubMed search failed: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    const pmids = searchData.esearchresult?.idlist || []

    if (pmids.length === 0) {
      return []
    }

    // Fetch article details
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?`
    const fetchParams = `db=pubmed&id=${pmids.join(',')}&retmode=xml`
    
    const fetchResponse = await fetch(fetchUrl + fetchParams)
    if (!fetchResponse.ok) {
      throw new Error(`PubMed fetch failed: ${fetchResponse.status}`)
    }

    const xmlText = await fetchResponse.text()
    
    // Parse XML and extract article data (simplified)
    const articles: Article[] = pmids.map((pmid: string) => ({
      external_id: pmid,
      source: 'pubmed',
      title: `Article ${pmid}`, // Would parse from XML
      pmid,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
    }))

    return articles

  } catch (error) {
    console.error('PubMed search error:', error)
    return []
  }
}

/* Usage Example:

POST /functions/v1/search-articles
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "uuid-of-project",
  "query": "systematic review diabetes",
  "databases": ["pubmed"],
  "maxResults": 50,
  "filters": {
    "dateFrom": "2020-01-01",
    "dateTo": "2024-12-31",
    "language": "english"
  }
}

Response:
{
  "success": true,
  "results": 25,
  "articles": [...],
  "timestamp": "2025-01-09T..."
}

*/