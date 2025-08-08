import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Upload } from 'lucide-react'

interface ProjectTypeSelectorProps {
  onSelectType: (type: 'guided' | 'upload') => void
}

export const ProjectTypeSelector: React.FC<ProjectTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Guided Path */}
      <Card className="cursor-pointer transition-all hover:shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">AI-Guided Setup</CardTitle>
          <CardDescription>
            Let our AI assistant help you define your research scope and methodology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Perfect for:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• New researchers</li>
              <li>• Starting from scratch</li>
              <li>• Need help with methodology</li>
              <li>• Want AI-powered query generation</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">What you'll get:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Interactive protocol development</li>
              <li>• AI-generated search queries</li>
              <li>• PICO framework guidance</li>
              <li>• Step-by-step workflow</li>
            </ul>
          </div>

          <Button 
            className="w-full mt-6" 
            onClick={() => onSelectType('guided')}
          >
            Start Guided Setup
          </Button>
        </CardContent>
      </Card>

      {/* Upload Path */}
      <Card className="cursor-pointer transition-all hover:shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-secondary/50 rounded-full w-16 h-16 flex items-center justify-center">
            <Upload className="h-8 w-8 text-secondary-foreground" />
          </div>
          <CardTitle className="text-xl">Bring Your Own Documents</CardTitle>
          <CardDescription>
            Upload your own collection of research papers and PDFs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Perfect for:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Experienced researchers</li>
              <li>• Have existing papers</li>
              <li>• Custom document collections</li>
              <li>• Specific data extraction needs</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">What you'll get:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Bulk PDF processing</li>
              <li>• Automated data extraction</li>
              <li>• Custom field definitions</li>
              <li>• Export ready datasets</li>
            </ul>
          </div>

          <Button 
            variant="outline" 
            className="w-full mt-6"
            onClick={() => onSelectType('upload')}
          >
            Upload Documents
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}