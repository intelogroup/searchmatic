import { DuplicateDetection, DuplicateMatchField } from '../types/articles'

// Text similarity algorithms
export class DeduplicationService {
  private readonly SIMILARITY_THRESHOLDS = {
    title: 0.85,
    authors: 0.75,
    doi: 1.0,  // Exact match required
    pmid: 1.0, // Exact match required
    journal: 0.8,
    publicationDate: 0.9
  }

  /**
   * Calculate similarity between two articles
   */
  calculateSimilarity(article1: any, article2: any): {
    score: number
    matchedFields: DuplicateMatchField[]
    details: Record<string, number>
  } {
    const similarities: Record<string, number> = {}
    const matchedFields: DuplicateMatchField[] = []

    // DOI comparison (exact match)
    if (article1.doi && article2.doi) {
      const doiSimilarity = article1.doi.toLowerCase() === article2.doi.toLowerCase() ? 1.0 : 0.0
      similarities.doi = doiSimilarity
      if (doiSimilarity >= this.SIMILARITY_THRESHOLDS.doi) {
        matchedFields.push('doi')
      }
    }

    // PMID comparison (exact match)
    if (article1.pmid && article2.pmid) {
      const pmidSimilarity = article1.pmid === article2.pmid ? 1.0 : 0.0
      similarities.pmid = pmidSimilarity
      if (pmidSimilarity >= this.SIMILARITY_THRESHOLDS.pmid) {
        matchedFields.push('pmid')
      }
    }

    // Title comparison
    if (article1.title && article2.title) {
      const titleSimilarity = this.calculateTextSimilarity(
        this.normalizeText(article1.title),
        this.normalizeText(article2.title)
      )
      similarities.title = titleSimilarity
      if (titleSimilarity >= this.SIMILARITY_THRESHOLDS.title) {
        matchedFields.push('title')
      }
    }

    // Authors comparison
    if (article1.authors && article2.authors) {
      const authorsSimilarity = this.calculateAuthorsSimilarity(
        article1.authors,
        article2.authors
      )
      similarities.authors = authorsSimilarity
      if (authorsSimilarity >= this.SIMILARITY_THRESHOLDS.authors) {
        matchedFields.push('authors')
      }
    }

    // Journal comparison
    if (article1.journal && article2.journal) {
      const journalSimilarity = this.calculateTextSimilarity(
        this.normalizeText(article1.journal),
        this.normalizeText(article2.journal)
      )
      similarities.journal = journalSimilarity
      if (journalSimilarity >= this.SIMILARITY_THRESHOLDS.journal) {
        matchedFields.push('journal')
      }
    }

    // Publication date comparison
    if (article1.publicationDate && article2.publicationDate) {
      const dateSimilarity = this.calculateDateSimilarity(
        article1.publicationDate,
        article2.publicationDate
      )
      similarities.publication_date = dateSimilarity
      if (dateSimilarity >= this.SIMILARITY_THRESHOLDS.publicationDate) {
        matchedFields.push('publication_date')
      }
    }

    // Calculate overall similarity score
    const overallScore = this.calculateOverallSimilarity(similarities, matchedFields)

    return {
      score: overallScore,
      matchedFields,
      details: similarities
    }
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim()
  }

  /**
   * Calculate text similarity using Jaccard similarity with n-grams
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0
    if (text1 === text2) return 1

    // Use both word-level and character n-gram similarity
    const wordSimilarity = this.jaccardSimilarity(
      this.getWords(text1),
      this.getWords(text2)
    )

    const trigramSimilarity = this.jaccardSimilarity(
      this.getTrigrams(text1),
      this.getTrigrams(text2)
    )

    // Weighted combination
    return (wordSimilarity * 0.7) + (trigramSimilarity * 0.3)
  }

  /**
   * Calculate authors similarity
   */
  private calculateAuthorsSimilarity(authors1: string[], authors2: string[]): number {
    if (!authors1?.length || !authors2?.length) return 0

    const normalizedAuthors1 = authors1.map(author => this.normalizeAuthor(author))
    const normalizedAuthors2 = authors2.map(author => this.normalizeAuthor(author))

    // Find matching authors
    let matches = 0
    for (const author1 of normalizedAuthors1) {
      for (const author2 of normalizedAuthors2) {
        if (this.calculateTextSimilarity(author1, author2) > 0.8) {
          matches++
          break
        }
      }
    }

    // Calculate similarity based on the ratio of matching authors
    const maxAuthors = Math.max(authors1.length, authors2.length)
    return matches / maxAuthors
  }

  /**
   * Normalize author names for comparison
   */
  private normalizeAuthor(author: string): string {
    return author
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\b\w\b/g, '') // Remove single letters (initials)
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Calculate date similarity
   */
  private calculateDateSimilarity(date1: string | Date, date2: string | Date): number {
    try {
      const d1 = new Date(date1)
      const d2 = new Date(date2)
      
      // Same year = high similarity
      if (d1.getFullYear() === d2.getFullYear()) {
        // Same month = perfect match
        if (d1.getMonth() === d2.getMonth()) {
          return 1.0
        }
        return 0.9
      }
      
      // Adjacent years = moderate similarity
      if (Math.abs(d1.getFullYear() - d2.getFullYear()) === 1) {
        return 0.7
      }
      
      return 0.0
    } catch {
      return 0.0
    }
  }

  /**
   * Calculate overall similarity score
   */
  private calculateOverallSimilarity(
    similarities: Record<string, number>,
    matchedFields: DuplicateMatchField[]
  ): number {
    // If DOI or PMID match, it's almost certainly a duplicate
    if (similarities.doi === 1.0 || similarities.pmid === 1.0) {
      return 1.0
    }

    // Weighted scoring
    const weights = {
      title: 0.4,
      authors: 0.25,
      journal: 0.15,
      publication_date: 0.1,
      doi: 0.05,
      pmid: 0.05
    }

    let weightedSum = 0
    let totalWeight = 0

    for (const [field, similarity] of Object.entries(similarities)) {
      const weight = weights[field as keyof typeof weights] || 0
      weightedSum += similarity * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  /**
   * Get words from text
   */
  private getWords(text: string): Set<string> {
    return new Set(text.split(/\s+/).filter(word => word.length > 2))
  }

  /**
   * Get character trigrams from text
   */
  private getTrigrams(text: string): Set<string> {
    const trigrams = new Set<string>()
    const cleanText = text.replace(/\s+/g, '')
    
    for (let i = 0; i <= cleanText.length - 3; i++) {
      trigrams.add(cleanText.substr(i, 3))
    }
    
    return trigrams
  }

  /**
   * Calculate Jaccard similarity between two sets
   */
  private jaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
    if (set1.size === 0 && set2.size === 0) return 1
    if (set1.size === 0 || set2.size === 0) return 0

    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size
  }

  /**
   * Find potential duplicates for a new article against existing articles
   */
  async findPotentialDuplicates(
    newArticle: any,
    existingArticles: any[],
    threshold = 0.8
  ): Promise<DuplicateDetection[]> {
    const duplicates: DuplicateDetection[] = []

    for (const existingArticle of existingArticles) {
      const similarity = this.calculateSimilarity(newArticle, existingArticle)
      
      if (similarity.score >= threshold) {
        duplicates.push({
          id: crypto.randomUUID(),
          article1Id: newArticle.id,
          article2Id: existingArticle.id,
          similarityScore: similarity.score,
          matchedFields: similarity.matchedFields,
          status: 'potential',
          notes: `Detected ${similarity.matchedFields.length} matching fields: ${similarity.matchedFields.join(', ')}`
        })
      }
    }

    return duplicates.sort((a, b) => b.similarityScore - a.similarityScore)
  }

  /**
   * Batch deduplication for multiple articles
   */
  async batchDeduplication(
    articles: any[],
    threshold = 0.8
  ): Promise<{
    duplicateGroups: any[][]
    uniqueArticles: any[]
    duplicateDetections: DuplicateDetection[]
  }> {
    const duplicateDetections: DuplicateDetection[] = []
    const processed = new Set<string>()
    const duplicateGroups: any[][] = []
    const uniqueArticles: any[] = []

    for (let i = 0; i < articles.length; i++) {
      if (processed.has(articles[i].id)) continue

      const currentGroup = [articles[i]]
      processed.add(articles[i].id)

      // Find all duplicates for this article
      for (let j = i + 1; j < articles.length; j++) {
        if (processed.has(articles[j].id)) continue

        const similarity = this.calculateSimilarity(articles[i], articles[j])
        
        if (similarity.score >= threshold) {
          currentGroup.push(articles[j])
          processed.add(articles[j].id)

          duplicateDetections.push({
            id: crypto.randomUUID(),
            article1Id: articles[i].id,
            article2Id: articles[j].id,
            similarityScore: similarity.score,
            matchedFields: similarity.matchedFields,
            status: 'potential',
            notes: `Auto-detected duplicate (${(similarity.score * 100).toFixed(1)}% similarity)`
          })
        }
      }

      if (currentGroup.length > 1) {
        duplicateGroups.push(currentGroup)
      } else {
        uniqueArticles.push(articles[i])
      }
    }

    return {
      duplicateGroups,
      uniqueArticles,
      duplicateDetections
    }
  }

  /**
   * Smart merge of duplicate articles
   */
  mergeArticles(articles: any[]): any {
    if (articles.length === 0) return null
    if (articles.length === 1) return articles[0]

    // Start with the most complete article (most fields filled)
    const primaryArticle = articles.reduce((best, current) => {
      const bestScore = this.calculateCompletenessScore(best)
      const currentScore = this.calculateCompletenessScore(current)
      return currentScore > bestScore ? current : best
    })

    // Merge information from other articles
    const merged = { ...primaryArticle }

    for (const article of articles) {
      if (article.id === primaryArticle.id) continue

      // Fill missing fields
      for (const [key, value] of Object.entries(article)) {
        if (!merged[key] && value) {
          merged[key] = value
        }
      }

      // Merge arrays (like authors, keywords)
      if (Array.isArray(article.authors) && Array.isArray(merged.authors)) {
        const combinedAuthors = [...new Set([...merged.authors, ...article.authors])]
        merged.authors = combinedAuthors
      }

      // Prefer more detailed abstracts
      if (article.abstract && article.abstract.length > (merged.abstract?.length || 0)) {
        merged.abstract = article.abstract
      }
    }

    // Add metadata about the merge
    merged.metadata = {
      ...merged.metadata,
      mergedFrom: articles.map(a => a.id),
      mergedAt: new Date().toISOString(),
      duplicateResolution: 'auto_merged'
    }

    return merged
  }

  /**
   * Calculate completeness score for an article
   */
  private calculateCompletenessScore(article: any): number {
    const fields = ['title', 'authors', 'abstract', 'journal', 'doi', 'pmid', 'publicationDate']
    let score = 0

    for (const field of fields) {
      if (article[field]) {
        if (Array.isArray(article[field])) {
          score += article[field].length > 0 ? 1 : 0
        } else if (typeof article[field] === 'string') {
          score += article[field].length > 0 ? 1 : 0
        } else {
          score += 1
        }
      }
    }

    return score / fields.length
  }

  /**
   * Generate duplicate detection rules
   */
  generateAutoDetectionRules(): {
    exact: (a: any, b: any) => boolean
    strong: (a: any, b: any) => boolean
    moderate: (a: any, b: any) => boolean
  } {
    return {
      exact: (a: any, b: any) => {
        return (a.doi && b.doi && a.doi === b.doi) ||
               (a.pmid && b.pmid && a.pmid === b.pmid)
      },
      strong: (a: any, b: any) => {
        const similarity = this.calculateSimilarity(a, b)
        return similarity.score >= 0.9
      },
      moderate: (a: any, b: any) => {
        const similarity = this.calculateSimilarity(a, b)
        return similarity.score >= 0.7
      }
    }
  }
}

// Create singleton instance
export const deduplicationService = new DeduplicationService()