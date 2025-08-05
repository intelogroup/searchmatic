/**
 * AI Analysis Panel Component
 * Advanced AI-powered literature analysis using edge functions
 */

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvancedAIWorkflow } from './AdvancedAIWorkflow'
import { 
  useEdgeFunctionHealth, 
  useAnalysisWorkflow,
  useAnalysisTypes 
} from '@/hooks/useEdgeFunctions'
import { errorLogger } from '@/lib/error-logger'

interface AIAnalysisPanelProps {
  projectId: string
}

interface AnalysisResult {
  type: string
  content: string
  timestamp: string
  tokens?: number
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ projectId }) => {
  const [articleText, setArticleText] = useState('')
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string>('')
  const [results, setResults] = useState<AnalysisResult[]>([])
  
  const healthQuery = useEdgeFunctionHealth()
  const analysisTypes = useAnalysisTypes()
  const workflow = useAnalysisWorkflow(projectId)
  
  const isEdgeFunctionsAvailable = healthQuery.data?.available ?? false
  const isAnalyzing = workflow.isAnalyzing
  
  const handleAnalyze = async () => {
    if (!articleText.trim() || !selectedAnalysisType) {
      errorLogger.logWarning('Missing article text or analysis type')
      return
    }
    
    try {
      const result = await workflow.analyzeText(
        articleText,
        selectedAnalysisType as any
      )
      
      const analysisResult: AnalysisResult = {
        type: result.analysisType,
        content: result.analysis,
        timestamp: result.timestamp,
        tokens: result.usage?.total_tokens
      }
      
      setResults(prev => [analysisResult, ...prev])
      
      errorLogger.logInfo('Analysis completed successfully', {
        feature: 'AIAnalysisPanel',
        action: 'handleAnalyze',
        metadata: {
          analysisType: selectedAnalysisType,
          tokens: result.usage?.total_tokens
        }
      })
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        feature: 'AIAnalysisPanel',
        action: 'handleAnalyze',
        metadata: { analysisType: selectedAnalysisType }
      })
    }
  }
  
  const clearResults = () => {
    setResults([])
    workflow.resetWorkflow()
  }
  
  const getAnalysisTypeLabel = (type: string) => {
    return analysisTypes.find(t => t.value === type)?.label || type
  }
  
  const getStatusColor = () => {
    switch (workflow.currentStep) {
      case 'analyzing': return 'blue'
      case 'completed': return 'green'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  return (
    <Tabs defaultValue="single" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="single">Single Analysis</TabsTrigger>
        <TabsTrigger value="advanced">Advanced Workflow</TabsTrigger>
      </TabsList>
      
      <TabsContent value="single" className="flex-1 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="text-lg font-semibold">AI Literature Analysis</h3>
        <div className="flex items-center space-x-2">
          <Badge variant={isEdgeFunctionsAvailable ? 'default' : 'destructive'}>
            {isEdgeFunctionsAvailable ? 'Functions Ready' : 'Functions Unavailable'}
          </Badge>
          {workflow.currentStep !== 'idle' && (
            <Badge variant="outline" className={`bg-${getStatusColor()}-50`}>
              {workflow.currentStep}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Health Check */}
      {healthQuery.isLoading && (
        <Card className="p-4 bg-blue-50">
          <p className="text-sm text-blue-700">Checking edge functions availability...</p>
        </Card>
      )}
      
      {!isEdgeFunctionsAvailable && !healthQuery.isLoading && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">
            ⚠️ Edge functions are not available. Please check your deployment.
          </p>
        </Card>
      )}
      
      {/* Input Section */}
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Article Text
            </label>
            <Textarea
              placeholder="Paste the article text, abstract, or research paper content here..."
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              className="min-h-[120px] resize-y"
              disabled={isAnalyzing}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Analysis Type
            </label>
            <Select 
              value={selectedAnalysisType} 
              onValueChange={setSelectedAnalysisType}
              disabled={isAnalyzing}
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
          
          <div className="flex space-x-2">
            <Button
              onClick={handleAnalyze}
              disabled={!isEdgeFunctionsAvailable || isAnalyzing || !articleText.trim() || !selectedAnalysisType}
              className="flex-1"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
            </Button>
            {results.length > 0 && (
              <Button
                variant="outline"
                onClick={clearResults}
                disabled={isAnalyzing}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      {/* Results Section */}
      {results.length > 0 && (
        <Card className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Analysis Results ({results.length})</h4>
          </div>
          
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">
                      {getAnalysisTypeLabel(result.type)}
                    </Badge>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {result.tokens && (
                        <span>{result.tokens} tokens</span>
                      )}
                      <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                      {result.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
      
      {/* Empty State */}
      {results.length === 0 && !isAnalyzing && (
        <Card className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-gray-50">
          <div className="text-4xl mb-4">🤖</div>
          <h4 className="font-medium text-gray-900 mb-2">AI-Powered Analysis Ready</h4>
          <p className="text-sm text-gray-600 mb-4 max-w-md">
            Paste article text above and select an analysis type to get AI-powered insights including 
            summaries, data extraction, quality assessment, and bias detection.
          </p>
          {!isEdgeFunctionsAvailable && (
            <p className="text-xs text-red-600">
              Edge functions need to be deployed and available for analysis.
            </p>
          )}
        </Card>
      )}
      </TabsContent>
      
      <TabsContent value="advanced" className="flex-1">
        <AdvancedAIWorkflow projectId={projectId} />
      </TabsContent>
    </Tabs>
  )
}