/**
 * Advanced AI Workflow Component
 * Showcases full admin capabilities with edge functions and batch processing
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  useBatchLiteratureAnalysis, 
  useEdgeFunctionHealth,
  useAnalysisTypes 
} from '@/hooks/useEdgeFunctions'
import { 
  Bot, 
  Zap, 
  FileText, 
  BarChart3, 
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  Download,
  Sparkles
} from 'lucide-react'

interface AdvancedAIWorkflowProps {
  projectId: string
}

interface BatchAnalysisResult {
  id: string
  title: string
  analysis: any
  error?: string
  status: 'pending' | 'analyzing' | 'completed' | 'error'
}

export const AdvancedAIWorkflow: React.FC<AdvancedAIWorkflowProps> = ({ projectId }) => {
  const [batchArticles, setBatchArticles] = useState('')
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('')
  const [batchResults, setBatchResults] = useState<BatchAnalysisResult[]>([])
  const [activeTab, setActiveTab] = useState('batch')
  
  const healthQuery = useEdgeFunctionHealth()
  const batchMutation = useBatchLiteratureAnalysis()
  const analysisTypes = useAnalysisTypes()
  
  const isEdgeFunctionsAvailable = healthQuery.data?.available ?? false
  
  const handleBatchAnalysis = async () => {
    if (!batchArticles.trim() || !selectedAnalysisType) return
    
    // Parse articles (simple line-by-line for now)
    const articles = batchArticles
      .split('\n---\n')
      .filter(text => text.trim())
      .map((text, index) => ({
        id: `article-${index + 1}`,
        text: text.trim()
      }))
    
    if (articles.length === 0) return
    
    // Initialize results
    const initialResults: BatchAnalysisResult[] = articles.map(article => ({
      id: article.id,
      title: `Article ${article.id.split('-')[1]}`,
      analysis: null,
      status: 'pending'
    }))
    
    setBatchResults(initialResults)
    
    try {
      const results = await batchMutation.mutateAsync({
        articles,
        analysisType: selectedAnalysisType as any,
        projectId
      })
      
      // Update results with API response
      const updatedResults = results.map(result => ({
        id: result.id,
        title: initialResults.find(r => r.id === result.id)?.title || result.id,
        analysis: result.analysis,
        error: result.error,
        status: result.analysis ? 'completed' as const : 'error' as const
      }))
      
      setBatchResults(updatedResults)
    } catch (error) {
      console.error('Batch analysis failed:', error)
    }
  }
  
  const successCount = batchResults.filter(r => r.status === 'completed').length
  const errorCount = batchResults.filter(r => r.status === 'error').length
  const progressPercent = batchResults.length > 0 
    ? Math.round(((successCount + errorCount) / batchResults.length) * 100)
    : 0

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Advanced AI Workflow</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isEdgeFunctionsAvailable ? 'default' : 'destructive'}>
            {isEdgeFunctionsAvailable ? 'Edge Functions Ready' : 'Functions Unavailable'}
          </Badge>
          {batchMutation.isAnalyzing && (
            <Badge variant="outline" className="bg-blue-50">
              <Clock className="h-3 w-3 mr-1" />
              Processing
            </Badge>
          )}
        </div>
      </div>
      
      {/* Health Status */}
      {!isEdgeFunctionsAvailable && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                Edge functions are not available. Advanced AI features require deployed functions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="batch">Batch Analysis</TabsTrigger>
          <TabsTrigger value="workflow">Smart Workflow</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="batch" className="flex-1 flex flex-col space-y-4">
          {/* Batch Analysis Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Batch Literature Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Articles (separate with "---")
                </label>
                <Textarea
                  placeholder={`Article 1 text here...
---
Article 2 text here...
---
Article 3 text here...`}
                  value={batchArticles}
                  onChange={(e) => setBatchArticles(e.target.value)}
                  className="min-h-[120px] resize-y"
                  disabled={batchMutation.isAnalyzing}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Analysis Type
                </label>
                <Select 
                  value={selectedAnalysisType} 
                  onValueChange={setSelectedAnalysisType}
                  disabled={batchMutation.isAnalyzing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select analysis type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {analysisTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleBatchAnalysis}
                disabled={!isEdgeFunctionsAvailable || batchMutation.isAnalyzing || !batchArticles.trim() || !selectedAnalysisType}
                className="w-full"
              >
                {batchMutation.isAnalyzing ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-pulse" />
                    Analyzing... ({batchMutation.progress.completed}/{batchMutation.progress.total})
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Start Batch Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {/* Progress */}
          {batchResults.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>✅ {successCount} completed</span>
                    <span>❌ {errorCount} errors</span>
                    <span>📄 {batchResults.length} total</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Results */}
          {batchResults.length > 0 && (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {batchResults.map((result) => (
                      <div key={result.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{result.title}</h4>
                          <Badge variant={
                            result.status === 'completed' ? 'default' :
                            result.status === 'error' ? 'destructive' :
                            result.status === 'analyzing' ? 'secondary' : 'outline'
                          }>
                            {result.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {result.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {result.status}
                          </Badge>
                        </div>
                        
                        {result.analysis && (
                          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            {result.analysis.analysis.substring(0, 150)}...
                          </div>
                        )}
                        
                        {result.error && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            Error: {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="workflow" className="flex-1 flex flex-col space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Smart Workflow Engine</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Auto-Screening</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Automatically screen articles based on inclusion criteria
                    </p>
                    <Button size="sm" variant="outline" disabled={!isEdgeFunctionsAvailable}>
                      Configure Rules
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Quality Assessment</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      AI-powered methodological quality evaluation
                    </p>
                    <Button size="sm" variant="outline" disabled={!isEdgeFunctionsAvailable}>
                      Start Assessment
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Data Extraction</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Structured data extraction with AI assistance
                    </p>
                    <Button size="sm" variant="outline" disabled={!isEdgeFunctionsAvailable}>
                      Create Template
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Synthesis</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      AI-powered synthesis and meta-analysis
                    </p>
                    <Button size="sm" variant="outline" disabled={!isEdgeFunctionsAvailable}>
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="flex-1 flex flex-col space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>AI Insights Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4" />
                <h4 className="font-medium text-foreground mb-2">Advanced Analytics Coming Soon</h4>
                <p className="text-sm mb-4">
                  Real-time insights, trend analysis, and predictive recommendations
                  powered by our edge functions and AI models.
                </p>
                <div className="flex justify-center space-x-2">
                  <Button size="sm" variant="outline" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}