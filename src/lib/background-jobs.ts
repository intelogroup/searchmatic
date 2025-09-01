/**
 * Background Job Processing System
 * Handles long-running tasks like search, duplicate detection, and data processing
 */

interface JobConfig {
  maxRetries: number
  retryDelay: number
  timeout: number
  priority: number
}

interface Job {
  id: string
  type: string
  payload: any
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying'
  progress: number
  result?: any
  error?: string
  retries: number
  createdAt: number
  updatedAt: number
  config: JobConfig
}

type JobHandler = (payload: any, updateProgress: (progress: number) => void) => Promise<any>

class BackgroundJobProcessor {
  private jobs = new Map<string, Job>()
  private handlers = new Map<string, JobHandler>()
  private running = false
  private maxConcurrent = 3
  private currentRunning = 0
  private pollInterval = 1000

  private defaultConfig: JobConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    timeout: 30000,
    priority: 5
  }

  constructor() {
    // Load jobs from localStorage
    this.loadJobsFromStorage()
    
    // Register default job handlers
    this.registerDefaultHandlers()
  }

  /**
   * Register a job handler
   */
  registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler)
  }

  /**
   * Add a job to the queue
   */
  addJob(
    type: string, 
    payload: any, 
    config: Partial<JobConfig> = {}
  ): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const job: Job = {
      id,
      type,
      payload,
      status: 'pending',
      progress: 0,
      retries: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: { ...this.defaultConfig, ...config }
    }

    this.jobs.set(id, job)
    this.saveJobsToStorage()
    
    // Start processing if not already running
    if (!this.running) {
      this.startProcessing()
    }

    return id
  }

  /**
   * Get job status
   */
  getJob(id: string): Job | null {
    return this.jobs.get(id) || null
  }

  /**
   * Get all jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      b.config.priority - a.config.priority || a.createdAt - b.createdAt
    )
  }

  /**
   * Cancel a job
   */
  cancelJob(id: string): boolean {
    const job = this.jobs.get(id)
    if (!job || job.status === 'running') {
      return false
    }

    job.status = 'failed'
    job.error = 'Cancelled by user'
    job.updatedAt = Date.now()
    
    this.saveJobsToStorage()
    return true
  }

  /**
   * Clear completed/failed jobs
   */
  clearFinishedJobs(): void {
    const toDelete = Array.from(this.jobs.entries())
      .filter(([_, job]) => job.status === 'completed' || job.status === 'failed')
      .map(([id, _]) => id)

    toDelete.forEach(id => this.jobs.delete(id))
    this.saveJobsToStorage()
  }

  /**
   * Start the job processing loop
   */
  startProcessing(): void {
    if (this.running) return
    
    this.running = true
    this.processJobs()
  }

  /**
   * Stop job processing
   */
  stopProcessing(): void {
    this.running = false
  }

  /**
   * Get processing statistics
   */
  getStats() {
    const jobs = Array.from(this.jobs.values())
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      retrying: jobs.filter(j => j.status === 'retrying').length,
      currentRunning: this.currentRunning,
      maxConcurrent: this.maxConcurrent
    }
  }

  private async processJobs(): Promise<void> {
    while (this.running) {
      try {
        // Get next job to process
        const pendingJobs = Array.from(this.jobs.values())
          .filter(job => job.status === 'pending' || job.status === 'retrying')
          .sort((a, b) => b.config.priority - a.config.priority || a.createdAt - b.createdAt)

        if (pendingJobs.length > 0 && this.currentRunning < this.maxConcurrent) {
          const job = pendingJobs[0]
          this.processJob(job)
        }

        await this.sleep(this.pollInterval)
      } catch (error) {
        console.error('Error in job processing loop:', error)
        await this.sleep(5000)
      }
    }
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type)
    if (!handler) {
      job.status = 'failed'
      job.error = `No handler found for job type: ${job.type}`
      job.updatedAt = Date.now()
      this.saveJobsToStorage()
      return
    }

    job.status = 'running'
    job.updatedAt = Date.now()
    this.currentRunning++
    this.saveJobsToStorage()

    const updateProgress = (progress: number) => {
      job.progress = Math.max(0, Math.min(100, progress))
      job.updatedAt = Date.now()
      this.saveJobsToStorage()
    }

    try {
      // Set timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), job.config.timeout)
      })

      const jobPromise = handler(job.payload, updateProgress)
      const result = await Promise.race([jobPromise, timeoutPromise])

      job.status = 'completed'
      job.progress = 100
      job.result = result
      job.updatedAt = Date.now()

    } catch (error) {
      job.retries++
      job.error = error instanceof Error ? error.message : String(error)
      job.updatedAt = Date.now()

      if (job.retries < job.config.maxRetries) {
        job.status = 'retrying'
        // Schedule retry
        setTimeout(() => {
          if (job.status === 'retrying') {
            job.status = 'pending'
            this.saveJobsToStorage()
          }
        }, job.config.retryDelay)
      } else {
        job.status = 'failed'
      }
    } finally {
      this.currentRunning--
      this.saveJobsToStorage()
    }
  }

  private registerDefaultHandlers(): void {
    // PubMed search job
    this.registerHandler('pubmed-search', async (payload, updateProgress) => {
      const { projectId, query, maxResults = 50 } = payload
      
      updateProgress(10)
      
      // Simulate API call chunks for large searches
      const chunkSize = 20
      const chunks = Math.ceil(maxResults / chunkSize)
      const results: any[] = []
      
      for (let i = 0; i < chunks; i++) {
        updateProgress(10 + (i / chunks) * 80)
        
        // Make actual API call here
        const response = await fetch('/api/pubmed-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            retstart: i * chunkSize,
            retmax: chunkSize
          })
        })
        
        if (!response.ok) throw new Error('Search failed')
        
        const data = await response.json()
        results.push(...data.articles)
        
        // Add delay to avoid rate limiting
        if (i < chunks - 1) {
          await this.sleep(1000)
        }
      }
      
      updateProgress(90)
      
      // Process and deduplicate results
      const processed = this.deduplicateArticles(results)
      
      updateProgress(100)
      
      return {
        articles: processed,
        totalFound: results.length,
        duplicatesRemoved: results.length - processed.length
      }
    })

    // Duplicate detection job
    this.registerHandler('duplicate-detection', async (payload, updateProgress) => {
      const { projectId, articleIds } = payload
      
      updateProgress(10)
      
      const duplicates: string[][] = []
      const processed = new Set<string>()
      
      for (let i = 0; i < articleIds.length; i++) {
        if (processed.has(articleIds[i])) continue
        
        updateProgress(10 + (i / articleIds.length) * 80)
        
        const similar = await this.findSimilarArticles(articleIds[i], articleIds)
        if (similar.length > 1) {
          duplicates.push(similar)
          similar.forEach(id => processed.add(id))
        }
      }
      
      updateProgress(100)
      
      return { duplicateGroups: duplicates }
    })

    // Data export job
    this.registerHandler('data-export', async (payload, updateProgress) => {
      const { projectId, format, filters } = payload
      
      updateProgress(20)
      
      // Fetch data
      const articles = await this.fetchProjectArticles(projectId, filters)
      
      updateProgress(60)
      
      // Convert to requested format
      let exportData: string
      switch (format) {
        case 'csv':
          exportData = this.convertToCSV(articles)
          break
        case 'json':
          exportData = JSON.stringify(articles, null, 2)
          break
        case 'xlsx':
          exportData = await this.convertToExcel(articles)
          break
        default:
          throw new Error('Unsupported export format')
      }
      
      updateProgress(90)
      
      // Save to temporary storage (implement based on your needs)
      const downloadUrl = await this.saveExportFile(exportData, format)
      
      updateProgress(100)
      
      return { 
        downloadUrl, 
        filename: `export-${projectId}-${Date.now()}.${format}`,
        recordCount: articles.length
      }
    })
  }

  private deduplicateArticles(articles: any[]): any[] {
    // Implement deduplication logic
    const seen = new Set<string>()
    return articles.filter(article => {
      const key = `${article.pmid || article.title.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private async findSimilarArticles(articleId: string, allIds: string[]): Promise<string[]> {
    // Implement similarity detection
    // This would use embeddings, title matching, etc.
    return [articleId] // Placeholder
  }

  private async fetchProjectArticles(projectId: string, filters: any): Promise<any[]> {
    // Implement article fetching
    return [] // Placeholder
  }

  private convertToCSV(articles: any[]): string {
    // Implement CSV conversion
    return '' // Placeholder
  }

  private async convertToExcel(articles: any[]): Promise<string> {
    // Implement Excel conversion
    return '' // Placeholder
  }

  private async saveExportFile(data: string, format: string): Promise<string> {
    // Implement file saving (could use Supabase Storage)
    return '' // Placeholder
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private loadJobsFromStorage(): void {
    try {
      const stored = localStorage.getItem('background_jobs')
      if (stored) {
        const data = JSON.parse(stored)
        Object.entries(data).forEach(([id, job]: [string, any]) => {
          // Reset running jobs to pending on load
          if (job.status === 'running') {
            job.status = 'pending'
          }
          this.jobs.set(id, job)
        })
      }
    } catch (error) {
      console.warn('Failed to load jobs from localStorage:', error)
    }
  }

  private saveJobsToStorage(): void {
    try {
      const data: Record<string, Job> = {}
      this.jobs.forEach((job, id) => {
        data[id] = job
      })
      localStorage.setItem('background_jobs', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save jobs to localStorage:', error)
    }
  }
}

// Create singleton instance
export const backgroundJobs = new BackgroundJobProcessor()

// Export types for external use
export type { Job, JobConfig, JobHandler }

// Convenience functions
export const addSearchJob = (projectId: string, query: string, maxResults: number = 50) => {
  return backgroundJobs.addJob('pubmed-search', { projectId, query, maxResults }, {
    priority: 8,
    timeout: 60000
  })
}

export const addDuplicateDetectionJob = (projectId: string, articleIds: string[]) => {
  return backgroundJobs.addJob('duplicate-detection', { projectId, articleIds }, {
    priority: 6,
    timeout: 120000
  })
}

export const addExportJob = (projectId: string, format: string, filters: any = {}) => {
  return backgroundJobs.addJob('data-export', { projectId, format, filters }, {
    priority: 4,
    timeout: 180000
  })
}

// Start processing on module load
backgroundJobs.startProcessing()

export default backgroundJobs