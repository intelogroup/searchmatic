import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BookOpen, 
  Brain, 
  Download, 
  Filter, 
  Search,
  Shield
} from 'lucide-react'

const features = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: "AI-Powered Research Assistant",
    description: "Get intelligent guidance through every step of your systematic review with GPT-4 integration."
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: "Multi-Database Search",
    description: "Search PubMed, Scopus, Web of Science, and more from a single, unified interface."
  },
  {
    icon: <Filter className="h-6 w-6" />,
    title: "Smart Deduplication",
    description: "Automatically identify and remove duplicate articles using advanced similarity algorithms."
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Protocol Management",
    description: "Create, version, and manage PICO/SPIDER research protocols with built-in templates."
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: "Flexible Export",
    description: "Export your results in multiple formats: CSV, Excel, RIS, BibTeX, and more."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure & Compliant",
    description: "Bank-level security with SOC 2 compliance and GDPR-ready data handling."
  }
]

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-muted/30" aria-labelledby="features-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need for world-class research
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive platform guides you through every step of the systematic review process
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4" aria-hidden="true">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}