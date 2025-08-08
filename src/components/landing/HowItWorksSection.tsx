import React from 'react'
import { Download, Filter, Lightbulb, Search } from 'lucide-react'

const steps = [
  {
    step: "1",
    title: "Define & Scope",
    description: "AI helps refine your research question and create PICO/SPIDER protocols",
    icon: <Lightbulb className="h-6 w-6" />
  },
  {
    step: "2", 
    title: "Search & Collect",
    description: "Multi-database search with real-time result counting and query optimization",
    icon: <Search className="h-6 w-6" />
  },
  {
    step: "3",
    title: "Screen & Extract", 
    description: "Smart deduplication and AI-assisted data extraction with validation",
    icon: <Filter className="h-6 w-6" />
  },
  {
    step: "4",
    title: "Export & Publish",
    description: "Generate publication-ready outputs in multiple formats",
    icon: <Download className="h-6 w-6" />
  }
]

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            From research question to publication in 4 steps
          </h2>
          <p className="text-xl text-muted-foreground">
            Our AI-guided workflow makes systematic reviews accessible to everyone
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => (
            <div key={index} className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground mx-auto mb-4 text-2xl font-bold">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}