// Edge Function for exporting project data in various formats
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  projectId: string
  exportType: 'csv' | 'excel' | 'json' | 'prisma' | 'endnote' | 'bibtex'
  includeFields: string[]
  filters?: {
    status?: string[]
    screening_decision?: string[]
    dateFrom?: string
    dateTo?: string
  }
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

    const { 
      projectId, 
      exportType, 
      includeFields = ['id', 'title', 'authors', 'journal', 'publication_date', 'doi', 'screening_decision'],
      filters = {}
    }: ExportRequest = await req.json()

    // Validate project ownership
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Build query for articles
    let query = supabaseClient
      .from('articles')
      .select(includeFields.join(','))
      .eq('project_id', projectId)

    // Apply filters
    if (filters.status) {
      query = query.in('status', filters.status)
    }
    if (filters.screening_decision) {
      query = query.in('screening_decision', filters.screening_decision)
    }
    if (filters.dateFrom) {
      query = query.gte('publication_date', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('publication_date', filters.dateTo)
    }

    const { data: articles, error: articlesError } = await query

    if (articlesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch articles' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Generate export data based on format
    let exportData: string
    let contentType: string
    let filename: string

    switch (exportType) {
      case 'csv':
        exportData = generateCSV(articles || [])
        contentType = 'text/csv'
        filename = `${project.title}-export.csv`
        break

      case 'json':
        exportData = JSON.stringify({
          project: {
            title: project.title,
            description: project.description,
            exportDate: new Date().toISOString()
          },
          articles: articles || []
        }, null, 2)
        contentType = 'application/json'
        filename = `${project.title}-export.json`
        break

      case 'bibtex':
        exportData = generateBibTeX(articles || [])
        contentType = 'text/plain'
        filename = `${project.title}-export.bib`
        break

      case 'endnote':
        exportData = generateEndNote(articles || [])
        contentType = 'text/plain'
        filename = `${project.title}-export.enw`
        break

      case 'prisma':
        exportData = generatePRISMA(articles || [], project)
        contentType = 'text/plain'
        filename = `${project.title}-prisma-data.txt`
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported export type' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    // Log export activity
    await supabaseClient
      .from('export_logs')
      .insert({
        project_id: projectId,
        user_id: user.id,
        export_type: exportType,
        record_count: articles?.length || 0,
        exported_at: new Date().toISOString()
      })

    return new Response(exportData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Count': (articles?.length || 0).toString()
      }
    })

  } catch (error) {
    console.error('Export Data Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Generate CSV format
function generateCSV(articles: any[]): string {
  if (articles.length === 0) return 'No data to export'

  const headers = Object.keys(articles[0])
  const csvRows = [headers.join(',')]

  for (const article of articles) {
    const values = headers.map(header => {
      const value = article[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      if (Array.isArray(value)) {
        return `"${value.join('; ')}"`
      }
      return String(value)
    })
    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}

// Generate BibTeX format
function generateBibTeX(articles: any[]): string {
  let bibtex = ''
  
  for (const article of articles) {
    const id = article.id || article.pmid || 'unknown'
    const type = article.journal ? 'article' : 'misc'
    
    bibtex += `@${type}{${id},\n`
    
    if (article.title) {
      bibtex += `  title = {${article.title}},\n`
    }
    if (article.authors && Array.isArray(article.authors)) {
      bibtex += `  author = {${article.authors.join(' and ')}},\n`
    }
    if (article.journal) {
      bibtex += `  journal = {${article.journal}},\n`
    }
    if (article.publication_date) {
      const year = new Date(article.publication_date).getFullYear()
      bibtex += `  year = {${year}},\n`
    }
    if (article.doi) {
      bibtex += `  doi = {${article.doi}},\n`
    }
    if (article.url) {
      bibtex += `  url = {${article.url}},\n`
    }
    
    bibtex += '}\n\n'
  }

  return bibtex
}

// Generate EndNote format
function generateEndNote(articles: any[]): string {
  let endnote = ''
  
  for (const article of articles) {
    endnote += '%0 Journal Article\n'
    
    if (article.title) {
      endnote += `%T ${article.title}\n`
    }
    if (article.authors && Array.isArray(article.authors)) {
      for (const author of article.authors) {
        endnote += `%A ${author}\n`
      }
    }
    if (article.journal) {
      endnote += `%J ${article.journal}\n`
    }
    if (article.publication_date) {
      const year = new Date(article.publication_date).getFullYear()
      endnote += `%D ${year}\n`
    }
    if (article.doi) {
      endnote += `%R ${article.doi}\n`
    }
    if (article.url) {
      endnote += `%U ${article.url}\n`
    }
    if (article.abstract) {
      endnote += `%X ${article.abstract}\n`
    }
    
    endnote += '\n'
  }

  return endnote
}

// Generate PRISMA flow data
function generatePRISMA(articles: any[], project: any): string {
  const total = articles.length
  const included = articles.filter((a: any) => a.screening_decision === 'include').length
  const excluded = articles.filter((a: any) => a.screening_decision === 'exclude').length
  const pending = articles.filter((a: any) => !a.screening_decision || a.screening_decision === 'maybe').length

  return `PRISMA Flow Data for: ${project.title}
Generated: ${new Date().toISOString()}

Identification:
- Records identified through database searching: ${total}

Screening:
- Records after duplicates removed: ${total}
- Records screened: ${included + excluded}
- Records excluded: ${excluded}

Eligibility:
- Full-text articles assessed for eligibility: ${included}
- Full-text articles included in systematic review: ${included}

Included:
- Studies included in systematic review: ${included}

Pending Review:
- Records pending screening: ${pending}

Export Summary:
Total records: ${total}
Included: ${included}
Excluded: ${excluded}
Pending: ${pending}
`
}

/* Usage Example:

POST /functions/v1/export-data
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "uuid-of-project",
  "exportType": "csv",
  "includeFields": ["title", "authors", "journal", "publication_date", "doi", "screening_decision"],
  "filters": {
    "screening_decision": ["include"],
    "dateFrom": "2020-01-01"
  }
}

Response: CSV file download with article data

Supported formats:
- csv: Comma-separated values
- json: JSON format with metadata
- bibtex: BibTeX citation format
- endnote: EndNote format
- prisma: PRISMA flow diagram data

*/