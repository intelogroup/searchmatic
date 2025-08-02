import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react'

export const NotFound: React.FC = () => {
  const navigate = useNavigate()

  const suggestions = [
    {
      title: 'Go to Dashboard',
      description: 'View your research projects and continue your work',
      icon: <Home className="h-5 w-5" />,
      action: () => navigate('/dashboard')
    },
    {
      title: 'Start New Project',
      description: 'Begin a new systematic literature review',
      icon: <Search className="h-5 w-5" />,
      action: () => navigate('/projects/new')
    },
    {
      title: 'View Documentation',
      description: 'Learn how to use Searchmatic effectively',
      icon: <BookOpen className="h-5 w-5" />,
      action: () => window.open('https://docs.searchmatic.ai', '_blank')
    }
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Visual */}
          <div className="mb-8">
            <div className="text-8xl font-bold text-muted-foreground/20 mb-4">404</div>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          </div>

          {/* Main Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Sorry, we couldn't find the page you're looking for. It might have been moved, 
              deleted, or you might have entered the wrong URL.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>

          {/* Helpful Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>What would you like to do?</CardTitle>
              <CardDescription>
                Here are some suggestions to help you get back on track
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={suggestion.action}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {suggestion.icon}
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{suggestion.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search Bar */}
          <div className="mt-8">
            <div className="flex items-center gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for help or documentation..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      window.open('https://docs.searchmatic.ai', '_blank')
                    }
                  }}
                />
              </div>
              <Button variant="outline" size="sm">
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}