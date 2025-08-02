import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'
import { ArrowLeft, Send, Lock, Unlock, CheckCircle2, Search, BarChart3 } from 'lucide-react'

export const ProjectDemo = () => {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [message, setMessage] = useState('')
  const [protocolLocked, setProtocolLocked] = useState(false)
  
  const isGuidedDemo = projectId === 'demo-guided'

  // Demo conversation messages
  const demoMessages = [
    {
      role: 'assistant',
      content: "Hello! I'm your AI research assistant. I'll help you develop a rigorous systematic review protocol. To start, could you tell me about the research question you'd like to investigate?",
      timestamp: '2 minutes ago'
    },
    {
      role: 'user',
      content: "I want to study the effectiveness of telemedicine interventions for managing diabetes in adults.",
      timestamp: '2 minutes ago'
    },
    {
      role: 'assistant',
      content: "Excellent topic! Telemedicine for diabetes management is very relevant. Let me help you structure this using the PICO framework. I can see your Population is adults with diabetes. For the Intervention, are you focusing on specific types of telemedicine (video consultations, remote monitoring, mobile apps) or all telemedicine interventions?",
      timestamp: '1 minute ago'
    }
  ]

  // Demo protocol data
  const protocolData = {
    population: "Adults (≥18 years) diagnosed with Type 1 or Type 2 diabetes mellitus",
    intervention: "Telemedicine interventions including video consultations, remote patient monitoring, mobile health applications, and digital health platforms",
    comparison: "Standard face-to-face care, usual care, or other diabetes management approaches",
    outcomes: {
      primary: "Glycemic control (HbA1c levels)",
      secondary: "Patient satisfaction, medication adherence, quality of life, healthcare utilization, cost-effectiveness"
    },
    inclusion: [
      "Randomized controlled trials (RCTs)",
      "Adults aged 18 years and older",
      "Diagnosed Type 1 or Type 2 diabetes",
      "English language publications",
      "Published 2010-2024"
    ],
    exclusion: [
      "Pediatric populations (<18 years)",
      "Gestational diabetes only",
      "Non-randomized studies",
      "Conference abstracts without full text",
      "Studies with <3 months follow-up"
    ]
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      // In real app, this would send to AI
      setMessage('')
    }
  }

  const handleLockProtocol = () => {
    setProtocolLocked(!protocolLocked)
  }

  // Main Content Component
  const MainContent = () => {
    if (isGuidedDemo) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Telemedicine for Diabetes Management</h1>
              <p className="text-muted-foreground">AI-guided systematic review setup</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Research Scope Defined
              </CardTitle>
              <CardDescription>
                Your research protocol has been developed through our AI-guided conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 font-medium text-green-800 mb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Protocol Development
                    </div>
                    <p className="text-sm text-green-700">Complete - Ready to lock in</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 font-medium text-blue-800 mb-2">
                      <Search className="h-4 w-4" />
                      Next: Query Building
                    </div>
                    <p className="text-sm text-blue-700">Generate search queries</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">What happens next?</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Lock in your research protocol (recommended)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      Generate database-specific search queries
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      Test and refine queries with count checking
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      Fetch and process abstracts
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation Summary</CardTitle>
              <CardDescription>
                Key points discussed with your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded">
                  <strong>Research Topic:</strong> Effectiveness of telemedicine for diabetes management
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <strong>Population:</strong> Adults with Type 1 or Type 2 diabetes
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <strong>Study Types:</strong> Randomized controlled trials (RCTs)
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <strong>Time Frame:</strong> 2010-2024, English language publications
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Upload demo content
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Document Upload Project</h1>
            <p className="text-muted-foreground">Processing your uploaded documents</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Processed</p>
                  <p className="text-2xl font-bold">18</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Search className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Extracting</p>
                  <p className="text-2xl font-bold">6</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload & Processing Status</CardTitle>
            <CardDescription>
              Your documents are being processed with AI-powered extraction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="text-sm text-muted-foreground">
                Processing 6 remaining documents. Estimated completion: 3 minutes
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Protocol Panel Component
  const ProtocolPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Research Protocol</h2>
        <Button
          variant={protocolLocked ? "outline" : "default"}
          size="sm"
          onClick={handleLockProtocol}
          className="flex items-center gap-2"
        >
          {protocolLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {protocolLocked ? 'Locked' : 'Lock In'}
        </Button>
      </div>

      {protocolLocked && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Protocol locked and ready for query generation
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm mb-2 text-muted-foreground">POPULATION</h3>
          <p className="text-sm">{protocolData.population}</p>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2 text-muted-foreground">INTERVENTION</h3>
          <p className="text-sm">{protocolData.intervention}</p>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2 text-muted-foreground">COMPARISON</h3>
          <p className="text-sm">{protocolData.comparison}</p>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2 text-muted-foreground">OUTCOMES</h3>
          <div className="text-sm space-y-1">
            <div><strong>Primary:</strong> {protocolData.outcomes.primary}</div>
            <div><strong>Secondary:</strong> {protocolData.outcomes.secondary}</div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2 text-muted-foreground">INCLUSION CRITERIA</h3>
          <ul className="text-sm space-y-1">
            {protocolData.inclusion.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2 text-muted-foreground">EXCLUSION CRITERIA</h3>
          <ul className="text-sm space-y-1">
            {protocolData.exclusion.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )

  // AI Chat Panel Component
  const AIChatPanel = () => (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h2 className="font-semibold">AI Research Assistant</h2>
        <p className="text-sm text-muted-foreground">Professor Mode - Research Guidance</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {demoMessages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              <div className="text-sm">{msg.content}</div>
              <div className="text-xs opacity-70 mt-1">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {isGuidedDemo && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-muted">
              <div className="text-sm">
                Great! I can see we have a well-defined research scope. Your protocol looks comprehensive. 
                Would you like me to generate some initial search queries for PubMed and other databases?
              </div>
              <div className="text-xs opacity-70 mt-1">Just now</div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me about methodology, inclusion criteria, search strategies..."
            className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button size="sm" onClick={handleSendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          💡 Try asking: "How should I structure my search terms?" or "What databases should I include?"
        </div>
      </div>
    </div>
  )

  return (
    <ThreePanelLayout
      mainContent={<MainContent />}
      protocolPanel={<ProtocolPanel />}
      aiChatPanel={<AIChatPanel />}
    />
  )
}