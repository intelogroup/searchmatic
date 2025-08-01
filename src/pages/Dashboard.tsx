import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { Plus } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Projects</h2>
          <p className="text-muted-foreground">
            Manage your systematic literature reviews
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* New Project Card */}
          <Card className="border-dashed hover:border-solid transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Project
              </CardTitle>
              <CardDescription>
                Start a new systematic review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => navigate('/projects/new')}
              >
                Create Project
              </Button>
            </CardContent>
          </Card>

          {/* Sample Project Cards - Replace with actual data */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Project</CardTitle>
              <CardDescription>
                Created 2 days ago
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>Status: <span className="font-medium">Active</span></p>
                <p>Articles: <span className="font-medium">45</span></p>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/projects/sample-id')}
              >
                Open Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}