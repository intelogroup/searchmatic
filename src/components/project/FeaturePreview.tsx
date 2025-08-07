import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export const FeaturePreview: React.FC = () => {
  return (
    <div className="mt-12">
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
        <CardContent className="p-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">What makes Searchmatic different?</h3>
            <div className="grid gap-6 md:grid-cols-3 text-sm">
              <div>
                <div className="font-medium mb-2">🤖 AI-Powered Assistant</div>
                <p className="text-muted-foreground">
                  Get guidance from our Professor AI persona throughout your review process
                </p>
              </div>
              <div>
                <div className="font-medium mb-2">⚡ Automated Processing</div>
                <p className="text-muted-foreground">
                  Automatic deduplication, screening, and data extraction from PDFs
                </p>
              </div>
              <div>
                <div className="font-medium mb-2">📊 Export Ready</div>
                <p className="text-muted-foreground">
                  Generate publication-ready datasets and PRISMA compliance reports
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}