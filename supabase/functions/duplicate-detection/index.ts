// Edge Function for detecting duplicate articles using AI and similarity matching
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DuplicateDetectionRequest {
  projectId: string
  threshold?: number // Similarity threshold (0.0 to 1.0)
  method?: 'ai' | 'rule_based' | 'hybrid'
  autoMerge?: boolean
}

interface DuplicateGroup {
  primary: any
  duplicates: any[]
  similarityScore: number
  matchingFields: string[]
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
      threshold = 0.85, 
      method = 'hybrid',
      autoMerge = false 
    }: DuplicateDetectionRequest = await req.json()

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

    // Fetch all articles for the project
    const { data: articles, error: articlesError } = await supabaseClient
      .from('articles')
      .select('*')
      .eq('project_id', projectId)
      .is('duplicate_of', null) // Only check non-duplicated articles

    if (articlesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch articles' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!articles || articles.length < 2) {
      return new Response(
        JSON.stringify({ 
          success: true,
          duplicateGroups: [],
          message: 'Not enough articles to check for duplicates'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let duplicateGroups: DuplicateGroup[] = []

    // Detect duplicates based on method
    switch (method) {
      case 'rule_based':
        duplicateGroups = await detectDuplicatesRuleBased(articles, threshold)
        break
      
      case 'ai':
        duplicateGroups = await detectDuplicatesAI(articles, threshold)
        break
      
      case 'hybrid':
        const ruleBasedGroups = await detectDuplicatesRuleBased(articles, threshold)
        const aiGroups = await detectDuplicatesAI(articles, 0.9) // Higher threshold for AI
        duplicateGroups = mergeDetectionResults(ruleBasedGroups, aiGroups)
        break
    }

    // Auto-merge duplicates if requested
    if (autoMerge && duplicateGroups.length > 0) {
      const mergedCount = await autoMergeDuplicates(supabaseClient, duplicateGroups)
      return new Response(
        JSON.stringify({
          success: true,
          duplicateGroups,
          autoMerged: true,
          mergedCount,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        duplicateGroups,
        totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0),
        method,
        threshold,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Duplicate Detection Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Rule-based duplicate detection
async function detectDuplicatesRuleBased(articles: any[], threshold: number): Promise<DuplicateGroup[]> {
  const duplicateGroups: DuplicateGroup[] = []
  const processed = new Set<string>()

  for (let i = 0; i < articles.length; i++) {
    if (processed.has(articles[i].id)) continue

    const primary = articles[i]
    const duplicates: any[] = []

    for (let j = i + 1; j < articles.length; j++) {
      if (processed.has(articles[j].id)) continue

      const candidate = articles[j]
      const similarity = calculateSimilarity(primary, candidate)

      if (similarity.score >= threshold) {
        duplicates.push(candidate)
        processed.add(candidate.id)
      }
    }

    if (duplicates.length > 0) {
      duplicateGroups.push({
        primary,
        duplicates,
        similarityScore: duplicates.length > 0 ? 
          Math.max(...duplicates.map(d => calculateSimilarity(primary, d).score)) : 0,
        matchingFields: duplicates.length > 0 ? 
          calculateSimilarity(primary, duplicates[0]).matchingFields : []
      })
      processed.add(primary.id)
    }
  }

  return duplicateGroups
}

// AI-based duplicate detection
async function detectDuplicatesAI(articles: any[], threshold: number): Promise<DuplicateGroup[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    console.log('OpenAI API key not available, falling back to rule-based detection')
    return detectDuplicatesRuleBased(articles, threshold)
  }

  // For demo purposes, we'll analyze a subset due to API limits
  const duplicateGroups: DuplicateGroup[] = []
  const maxArticles = Math.min(articles.length, 20) // Limit for API costs

  try {
    // Prepare article data for AI analysis
    const articleSummaries = articles.slice(0, maxArticles).map((article, index) => ({
      index,
      id: article.id,
      title: article.title || '',
      authors: Array.isArray(article.authors) ? article.authors.join(', ') : '',
      journal: article.journal || '',
      year: article.publication_date ? new Date(article.publication_date).getFullYear() : '',
      doi: article.doi || '',
      abstract: article.abstract ? article.abstract.substring(0, 200) : ''
    }))

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a research duplicate detection expert. Analyze the provided articles and identify potential duplicates based on titles, authors, journals, and abstracts. 
            
Return your analysis as JSON in this format:
{
  "duplicateGroups": [
    {
      "primaryIndex": 0,
      "duplicateIndexes": [5, 12],
      "confidence": 0.95,
      "reasoning": "Same title, authors, and journal"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Analyze these articles for duplicates:\n\n${JSON.stringify(articleSummaries, null, 2)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const result = data.choices[0]?.message?.content

    try {
      const aiResults = JSON.parse(result)
      
      // Convert AI results to our format
      for (const group of aiResults.duplicateGroups || []) {
        if (group.confidence >= threshold) {
          const primary = articles[group.primaryIndex]
          const duplicates = group.duplicateIndexes.map((idx: number) => articles[idx])

          duplicateGroups.push({
            primary,
            duplicates,
            similarityScore: group.confidence,
            matchingFields: ['ai_detected']
          })
        }
      }

    } catch (parseError) {
      console.error('Failed to parse AI results:', parseError)
    }

  } catch (error) {
    console.error('AI duplicate detection error:', error)
  }

  return duplicateGroups
}

// Calculate similarity between two articles
function calculateSimilarity(article1: any, article2: any): { score: number, matchingFields: string[] } {
  const matchingFields: string[] = []
  let score = 0
  let totalFields = 0

  // Title similarity (most important)
  if (article1.title && article2.title) {
    totalFields += 3 // Weight title more heavily
    const titleSim = stringSimilarity(article1.title, article2.title)
    score += titleSim * 3
    if (titleSim > 0.8) matchingFields.push('title')
  }

  // Author similarity
  if (article1.authors && article2.authors) {
    totalFields += 2
    const authorSim = arrayStringsSimilarity(article1.authors, article2.authors)
    score += authorSim * 2
    if (authorSim > 0.7) matchingFields.push('authors')
  }

  // DOI match (exact)
  if (article1.doi && article2.doi) {
    totalFields += 2
    if (article1.doi === article2.doi) {
      score += 2
      matchingFields.push('doi')
    }
  }

  // Journal match
  if (article1.journal && article2.journal) {
    totalFields += 1
    const journalSim = stringSimilarity(article1.journal, article2.journal)
    score += journalSim
    if (journalSim > 0.9) matchingFields.push('journal')
  }

  // Publication year match
  if (article1.publication_date && article2.publication_date) {
    totalFields += 1
    const year1 = new Date(article1.publication_date).getFullYear()
    const year2 = new Date(article2.publication_date).getFullYear()
    if (year1 === year2) {
      score += 1
      matchingFields.push('year')
    }
  }

  const finalScore = totalFields > 0 ? score / totalFields : 0
  return { score: finalScore, matchingFields }
}

// String similarity using simple approach
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

// Levenshtein distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Array strings similarity (for authors)
function arrayStringsSimilarity(arr1: string[], arr2: string[]): number {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return 0
  if (arr1.length === 0 && arr2.length === 0) return 1
  if (arr1.length === 0 || arr2.length === 0) return 0

  const matches = arr1.filter(item1 => 
    arr2.some(item2 => stringSimilarity(item1, item2) > 0.8)
  ).length

  return matches / Math.max(arr1.length, arr2.length)
}

// Merge detection results from multiple methods
function mergeDetectionResults(groups1: DuplicateGroup[], groups2: DuplicateGroup[]): DuplicateGroup[] {
  const merged = [...groups1]
  
  for (const group2 of groups2) {
    const existing = merged.find(g => g.primary.id === group2.primary.id)
    if (!existing) {
      merged.push(group2)
    } else {
      // Merge duplicate lists
      for (const dup of group2.duplicates) {
        if (!existing.duplicates.find(d => d.id === dup.id)) {
          existing.duplicates.push(dup)
        }
      }
    }
  }
  
  return merged
}

// Auto-merge duplicates by marking them
async function autoMergeDuplicates(supabaseClient: any, groups: DuplicateGroup[]): Promise<number> {
  let mergedCount = 0

  for (const group of groups) {
    for (const duplicate of group.duplicates) {
      const { error } = await supabaseClient
        .from('articles')
        .update({
          duplicate_of: group.primary.id,
          similarity_score: group.similarityScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', duplicate.id)

      if (!error) {
        mergedCount++
      }
    }
  }

  return mergedCount
}

/* Usage Example:

POST /functions/v1/duplicate-detection
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "uuid-of-project",
  "threshold": 0.85,
  "method": "hybrid",
  "autoMerge": false
}

Response:
{
  "success": true,
  "duplicateGroups": [
    {
      "primary": { "id": "...", "title": "..." },
      "duplicates": [
        { "id": "...", "title": "..." }
      ],
      "similarityScore": 0.95,
      "matchingFields": ["title", "authors", "doi"]
    }
  ],
  "totalDuplicates": 5,
  "method": "hybrid",
  "threshold": 0.85,
  "timestamp": "2025-01-09T..."
}

*/